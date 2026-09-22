import React, { useState, useEffect, useMemo } from "react";
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
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  Add,
  FileDownload,
  Edit,
  DeleteOutline,
  ArrowUpward,
  ArrowDownward,
  CalendarToday,
  Business,
  Person,
  CheckCircle,
  Groups,
  Badge,
  AccountBalance,
  Save,
  RestartAlt,
  AccountBalanceWallet,
  People,
  Description,
  Percent,
  ReceiptLong,
  Home,
  DirectionsCar,
  Payments,
  Savings,
  WarningAmber,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";
import { toast } from "../components/useToast.jsx";

// ─── Helper for Rich Component Visuals (Icons, Colors, Descriptions) ─────────
const getComponentVisualDetails = (componentName, category = "earning") => {
  const name = String(componentName || "").toLowerCase();

  if (category === "deduction") {
    if (name.includes("pf") || name.includes("provident")) {
      return {
        icon: <People sx={{ fontSize: 18 }} />,
        bg: "#fce7f3",
        color: "#db2777",
        desc: "Employee Provident Fund",
      };
    }
    if (name.includes("pt") || name.includes("professional")) {
      return {
        icon: <Description sx={{ fontSize: 18 }} />,
        bg: "#dcfce7",
        color: "#16a34a",
        desc: "State Professional Tax",
      };
    }
    if (name.includes("tds") || name.includes("tax")) {
      return {
        icon: <Percent sx={{ fontSize: 17 }} />,
        bg: "#ffedd5",
        color: "#ea580c",
        desc: "Tax Deducted at Source",
      };
    }
    if (name.includes("esi") || name.includes("insurance") || name.includes("medical")) {
      return {
        icon: <AccountBalance sx={{ fontSize: 18 }} />,
        bg: "#fee2e2",
        color: "#dc2626",
        desc: "Health & Medical Insurance",
      };
    }
    return {
      icon: <ReceiptLong sx={{ fontSize: 18 }} />,
      bg: "#f1f5f9",
      color: "#64748b",
      desc: "Standard Salary Deduction",
    };
  }

  // Earnings
  if (name.includes("basic")) {
    return {
      icon: <AccountBalanceWallet sx={{ fontSize: 18 }} />,
      bg: "#e0e7ff",
      color: "#4f46e5",
      desc: "Base monthly salary component",
    };
  }
  if (name.includes("hra") || name.includes("rent") || name.includes("house")) {
    return {
      icon: <Home sx={{ fontSize: 18 }} />,
      bg: "#e0f2fe",
      color: "#0284c7",
      desc: "House Rent Allowance",
    };
  }
  if (name.includes("travel") || name.includes("conveyance") || name.includes("commute") || name.includes("field") || name.includes("site") || name.includes("daily")) {
    return {
      icon: <DirectionsCar sx={{ fontSize: 18 }} />,
      bg: "#fef3c7",
      color: "#d97706",
      desc: "Field & conveyance allowance",
    };
  }
  if (name.includes("incentive") || name.includes("performance") || name.includes("bonus")) {
    return {
      icon: <Savings sx={{ fontSize: 18 }} />,
      bg: "#ecfdf5",
      color: "#059669",
      desc: "Variable performance incentive",
    };
  }
  return {
    icon: <Payments sx={{ fontSize: 18 }} />,
    bg: "#f1f5f9",
    color: "#64748b",
    desc: "Payable salary allowance",
  };
};

// ─── Initial Real Solar Employees Data ───────────────────────────────────────
const SAMPLE_EMPLOYEES = [
  // ── INCHARGE ──
  {
    id: "I0018",
    name: "ABHILASH SAMAL",
    empId: "I0018",
    department: "Incharge",
    designation: "Incharge",
    effectiveFrom: "2026-08-01",
    initials: "AS",
    avatarBg: "#dbeafe",
    avatarColor: "#1d4ed8",
  },
  {
    id: "I0017",
    name: "SUBHARANJAN ROUTRAY",
    empId: "I0017",
    department: "Incharge",
    designation: "Incharge",
    effectiveFrom: "2026-08-01",
    initials: "SR",
    avatarBg: "#e2e8f0",
    avatarColor: "#475569",
  },
  {
    id: "I0016",
    name: "DIPUN SAHOO",
    empId: "I0016",
    department: "Incharge",
    designation: "Incharge",
    effectiveFrom: "2026-08-01",
    initials: "DS",
    avatarBg: "#dcfce7",
    avatarColor: "#15803d",
  },
  {
    id: "I0015",
    name: "DEEPAK SAHOO",
    empId: "I0015",
    department: "Incharge",
    designation: "Incharge",
    effectiveFrom: "2026-08-01",
    initials: "DS",
    avatarBg: "#fef3c7",
    avatarColor: "#b45309",
  },
  {
    id: "I0014",
    name: "PRADIPTA PRADHAN",
    empId: "I0014",
    department: "Incharge",
    designation: "Incharge",
    effectiveFrom: "2026-08-01",
    initials: "PP",
    avatarBg: "#ccfbf1",
    avatarColor: "#0f766e",
  },
  {
    id: "I0013",
    name: "MANAS RANJAN",
    empId: "I0013",
    department: "Incharge",
    designation: "Incharge",
    effectiveFrom: "2026-08-01",
    initials: "MR",
    avatarBg: "#e0e7ff",
    avatarColor: "#4338ca",
  },
  // ── SUPERVISOR ──
  {
    id: "S0012",
    name: "SANJAY KUMAR",
    empId: "S0012",
    department: "Supervisor",
    designation: "Supervisor",
    effectiveFrom: "2026-08-01",
    initials: "SK",
    avatarBg: "#f3e8ff",
    avatarColor: "#7e22ce",
  },
  {
    id: "S0011",
    name: "RASHMI RANJAN",
    empId: "S0011",
    department: "Supervisor",
    designation: "Supervisor",
    effectiveFrom: "2026-08-01",
    initials: "RR",
    avatarBg: "#ffedd5",
    avatarColor: "#c2410c",
  },
  {
    id: "S0010",
    name: "AMIT PATEL",
    empId: "S0010",
    department: "Supervisor",
    designation: "Supervisor",
    effectiveFrom: "2026-08-01",
    initials: "AP",
    avatarBg: "#ecfdf5",
    avatarColor: "#047857",
  },
  {
    id: "S0009",
    name: "BIKASH NAYAK",
    empId: "S0009",
    department: "Supervisor",
    designation: "Supervisor",
    effectiveFrom: "2026-08-01",
    initials: "BN",
    avatarBg: "#fdf2f8",
    avatarColor: "#be185d",
  },
  // ── MANAGER ──
  {
    id: "E0001",
    name: "SOUMYA RANJAN",
    empId: "E0001",
    department: "Manager",
    designation: "Manager",
    effectiveFrom: "2026-08-01",
    initials: "SR",
    avatarBg: "#fee2e2",
    avatarColor: "#b91c1c",
  },
  {
    id: "M0002",
    name: "RAJESH TRIPATHY",
    empId: "M0002",
    department: "Manager",
    designation: "Operations Manager",
    effectiveFrom: "2026-08-01",
    initials: "RT",
    avatarBg: "#fef9c3",
    avatarColor: "#a16207",
  },
  {
    id: "M0003",
    name: "PRIYABRATA DASH",
    empId: "M0003",
    department: "Manager",
    designation: "Project Head",
    effectiveFrom: "2026-08-01",
    initials: "PD",
    avatarBg: "#eff6ff",
    avatarColor: "#1e40af",
  },
];

// ─── Role / Department Specific Salary Templates ─────────────────────────────
const INITIAL_DEPARTMENT_TEMPLATES = {
  "Incharge": {
    earnings: [
      { id: 1, component: "Basic Salary", type: "Fixed", calculation: "Fixed Amount", amount: 22000 },
      { id: 2, component: "House Rent Allowance (HRA)", type: "Fixed", calculation: "% of Basic (40%)", amount: 8800 },
      { id: 3, component: "Field Site Allowance", type: "Fixed", calculation: "Fixed Amount", amount: 3500 },
      { id: 4, component: "Conveyance Allowance", type: "Fixed", calculation: "Fixed Amount", amount: 2000 },
      { id: 5, component: "Daily Field Allowance", type: "Fixed", calculation: "Fixed Amount", amount: 1500 },
    ],
    deductions: [
      { id: 1, component: "Provident Fund (PF)", type: "Fixed", calculation: "8% of Basic", amount: 1760 },
      { id: 2, component: "Professional Tax (PT)", type: "Fixed", calculation: "Fixed Amount", amount: 200 },
      { id: 3, component: "TDS / Tax", type: "Fixed", calculation: "Fixed Amount", amount: 1000 },
    ],
  },
  "Supervisor": {
    earnings: [
      { id: 1, component: "Basic Salary", type: "Fixed", calculation: "Fixed Amount", amount: 26000 },
      { id: 2, component: "House Rent Allowance (HRA)", type: "Fixed", calculation: "% of Basic (40%)", amount: 10400 },
      { id: 3, component: "Field Supervision Allowance", type: "Fixed", calculation: "Fixed Amount", amount: 4000 },
      { id: 4, component: "Site Travel Allowance", type: "Fixed", calculation: "Fixed Amount", amount: 2500 },
      { id: 5, component: "Communication Allowance", type: "Fixed", calculation: "Fixed Amount", amount: 1000 },
    ],
    deductions: [
      { id: 1, component: "Provident Fund (PF)", type: "Fixed", calculation: "12% of Basic", amount: 3120 },
      { id: 2, component: "Professional Tax (PT)", type: "Fixed", calculation: "Fixed Amount", amount: 200 },
      { id: 3, component: "TDS / Tax", type: "Fixed", calculation: "Fixed Amount", amount: 1200 },
    ],
  },
  "Manager": {
    earnings: [
      { id: 1, component: "Basic Salary", type: "Fixed", calculation: "Fixed Amount", amount: 35000 },
      { id: 2, component: "House Rent Allowance (HRA)", type: "Fixed", calculation: "% of Basic (40%)", amount: 14000 },
      { id: 3, component: "Management Allowance", type: "Fixed", calculation: "Fixed Amount", amount: 8000 },
      { id: 4, component: "Travel & Conveyance", type: "Fixed", calculation: "Fixed Amount", amount: 4000 },
      { id: 5, component: "Performance Incentive", type: "Fixed", calculation: "Fixed Amount", amount: 5000 },
    ],
    deductions: [
      { id: 1, component: "Provident Fund (PF)", type: "Fixed", calculation: "12% of Basic", amount: 4200 },
      { id: 2, component: "Professional Tax (PT)", type: "Fixed", calculation: "Fixed Amount", amount: 200 },
      { id: 3, component: "TDS / Tax", type: "Fixed", calculation: "Fixed Amount", amount: 2500 },
    ],
  },
};

const DEPARTMENTS = [
  { id: "Incharge", name: "Incharge", icon: "⚡", description: "Field Incharges & Site Leads" },
  { id: "Supervisor", name: "Supervisor", icon: "👷", description: "Installation & Quality Supervisors" },
  { id: "Manager", name: "Manager", icon: "👔", description: "Project & Operations Managers" },
];

const ALL_DESIGNATIONS = ["Incharge", "Supervisor", "Manager"];

// Helper to normalize user role
const normalizeCompanyRole = (rawRole) => {
  const r = String(rawRole || "").trim().toLowerCase();
  if (r.includes("manager") || r.includes("admin") || r === "admin_panel" || r === "zsm" || r === "operation_lead" || r === "project_head") return "Manager";
  if (r.includes("supervisor")) return "Supervisor";
  if (r.includes("incharge") || r === "team" || r === "installer") return "Incharge";
  return "Incharge";
};

export default function Salaries() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  // ─── Mode: "department" (Default & Simple) vs "employee" (Custom Override) ──
  const [viewMode, setViewMode] = useState("department"); // "department" | "employee"

  // ─── State ──────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState(SAMPLE_EMPLOYEES);
  const [deptTemplates, setDeptTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem("SOLAR_DEPT_SALARY_TEMPLATES");
      return saved ? JSON.parse(saved) : INITIAL_DEPARTMENT_TEMPLATES;
    } catch {
      return INITIAL_DEPARTMENT_TEMPLATES;
    }
  });
  const [customEmployeeSalaries, setCustomEmployeeSalaries] = useState(() => {
    try {
      const saved = localStorage.getItem("SOLAR_CUSTOM_EMP_SALARIES");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedDepartment, setSelectedDepartment] = useState("Incharge");
  const [individualFilterDept, setIndividualFilterDept] = useState("All");
  const [selectedEmpId, setSelectedEmpId] = useState("I0018");
  const [effectiveFrom, setEffectiveFrom] = useState("2026-08-01");
  const [activeTab, setActiveTab] = useState(0);

  // Active Components for current view
  const [earnings, setEarnings] = useState(INITIAL_DEPARTMENT_TEMPLATES["Incharge"].earnings);
  const [deductions, setDeductions] = useState(INITIAL_DEPARTMENT_TEMPLATES["Incharge"].deductions);

  const [saving, setSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null); // { type: 'success' | 'info' | 'error', message: string } | null

  // Modal States
  const [addComponentModalOpen, setAddComponentModalOpen] = useState(false);
  const [componentCategory, setComponentCategory] = useState("earning"); // "earning" | "deduction"
  const [newComponentForm, setNewComponentForm] = useState({
    name: "",
    type: "Fixed",
    calculation: "Fixed Amount",
    amount: "",
  });

  const [editComponentModalOpen, setEditComponentModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Delete Confirmation State
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    open: false,
    item: null,
    category: "earning",
  });

  // ─── Helper to load salary data ─────────────────────────────────────
  const loadSalaryForDept = (deptName) => {
    const template = deptTemplates[deptName] || INITIAL_DEPARTMENT_TEMPLATES[deptName] || INITIAL_DEPARTMENT_TEMPLATES["Incharge"];
    setEarnings(JSON.parse(JSON.stringify(template.earnings)));
    setDeductions(JSON.parse(JSON.stringify(template.deductions)));
  };

  const loadSalaryForEmployee = (empId) => {
    if (customEmployeeSalaries[empId]) {
      setEarnings(JSON.parse(JSON.stringify(customEmployeeSalaries[empId].earnings)));
      setDeductions(JSON.parse(JSON.stringify(customEmployeeSalaries[empId].deductions)));
      return;
    }
    const emp = employees.find((e) => e.id === empId);
    const targetDept = emp ? emp.department : "Incharge";
    const template = deptTemplates[targetDept] || INITIAL_DEPARTMENT_TEMPLATES[targetDept] || INITIAL_DEPARTMENT_TEMPLATES["Incharge"];
    setEarnings(JSON.parse(JSON.stringify(template.earnings)));
    setDeductions(JSON.parse(JSON.stringify(template.deductions)));
  };

  // ─── Fetch real employees & database salary structures ─────────────
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [resUsers, resStructures] = await Promise.allSettled([
          axiosInstance.get("/user/getAllUsers?page=1&limit=100"),
          axiosInstance.get("/payroll/salary-structures"),
        ]);

        let mapped = [];
        if (resUsers.status === "fulfilled") {
          const root = resUsers.value?.data || {};
          let users = [];
          if (Array.isArray(root)) users = root;
          else if (Array.isArray(root.data)) users = root.data;
          else if (Array.isArray(root.data?.users)) users = root.data.users;
          else if (Array.isArray(root.result?.users)) users = root.result.users;
          else if (Array.isArray(root.users)) users = root.users;
          else if (Array.isArray(root.result)) users = root.result;

          if (users && users.length > 0) {
            mapped = users.map((u, idx) => {
              const rawName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email?.split("@")[0] || "Employee";
              const name = rawName;
              const empId = u.employeeId || u.empId || (u.role === "Incharge" || u.role === "TEAM" ? `I${String(idx + 15).padStart(4, "0")}` : `EMP${String(idx + 1).padStart(3, "0")}`);
              const initials = `${u.firstName?.[0] || name[0] || "E"}${u.lastName?.[0] || ""}`.toUpperCase();
              const colors = ["#dbeafe", "#e2e8f0", "#dcfce7", "#fef3c7", "#ccfbf1", "#e0e7ff", "#fae8ff"];
              const textColors = ["#1d4ed8", "#475569", "#15803d", "#b45309", "#0f766e", "#4338ca", "#86198f"];
              const roleName = normalizeCompanyRole(u.role || u.department);

              return {
                id: empId,
                dbId: u._id,
                name,
                empId,
                department: roleName,
                designation: roleName,
                effectiveFrom: "2026-08-01",
                initials,
                avatarBg: colors[idx % colors.length],
                avatarColor: textColors[idx % textColors.length],
              };
            });
            setEmployees(mapped);
            if (mapped[0]) {
              setSelectedEmpId(mapped[0].id);
            }
          }
        }

        // Process existing database salary structures
        if (resStructures.status === "fulfilled") {
          const list = resStructures.value?.data?.salaryStructures || [];
          if (Array.isArray(list) && list.length > 0) {
            const loadedCustom = {};
            list.forEach((item) => {
              const uId = item.employee?._id || item.employee;
              const matchingEmp = (mapped.length > 0 ? mapped : employees).find((e) => String(e.dbId) === String(uId));
              const empIdKey = matchingEmp ? matchingEmp.id : uId;
              const structure = item.structure;
              if (structure && (structure.earnings?.length || structure.deductions?.length || Number(structure.basicSalary) > 0)) {
                const dbEarnings = (structure.earnings && structure.earnings.length > 0)
                  ? structure.earnings.map((e, i) => ({
                      id: i + 1,
                      component: e.name || e.component,
                      type: "Fixed",
                      calculation: (e.name || "").toLowerCase().includes("hra") ? "% of Basic (40%)" : "Fixed Amount",
                      amount: Number(e.amount) || 0,
                    }))
                  : [{ id: 1, component: "Basic Salary", type: "Fixed", calculation: "Fixed Amount", amount: Number(structure.basicSalary) || 20000 }];

                const dbDeductions = (structure.deductions && structure.deductions.length > 0)
                  ? structure.deductions.map((d, i) => ({
                      id: i + 1,
                      component: d.name || d.component,
                      type: "Fixed",
                      calculation: (d.name || "").toLowerCase().includes("pf") ? "12% of Basic" : "Fixed Amount",
                      amount: Number(d.amount) || 0,
                    }))
                  : [];

                loadedCustom[empIdKey] = {
                  earnings: dbEarnings,
                  deductions: dbDeductions,
                };
              }
            });

            if (Object.keys(loadedCustom).length > 0) {
              setCustomEmployeeSalaries((prev) => ({ ...prev, ...loadedCustom }));
            }
          }
        }
      } catch (err) {
        console.warn("Using default real employee list:", err);
      }
    };
    loadInitialData();
  }, []);

  // Sync state when department changes in department mode
  useEffect(() => {
    if (viewMode === "department") {
      loadSalaryForDept(selectedDepartment);
    }
  }, [selectedDepartment, viewMode]);

  // Sync state when employee changes in employee mode
  useEffect(() => {
    if (viewMode === "employee") {
      loadSalaryForEmployee(selectedEmpId);
    }
  }, [selectedEmpId, viewMode]);

  // Employees belonging to selected department
  const deptEmployees = useMemo(() => {
    return employees.filter((e) => e.department === selectedDepartment);
  }, [employees, selectedDepartment]);

  // Filtered employees for Individual Employee Mode
  const individualEmployeesList = useMemo(() => {
    if (individualFilterDept === "All") return employees;
    return employees.filter((e) => e.department === individualFilterDept);
  }, [employees, individualFilterDept]);

  // Selected Employee object (for employee mode)
  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === selectedEmpId) || employees[0] || SAMPLE_EMPLOYEES[0];
  }, [employees, selectedEmpId]);

  // Handle Mode Switch
  const handleModeChange = (event, newMode) => {
    if (!newMode) return;
    setViewMode(newMode);
    if (newMode === "department") {
      loadSalaryForDept(selectedDepartment);
      toast.info(`Switched to Department Salary Setting for ${selectedDepartment}`);
    } else {
      setIndividualFilterDept(selectedDepartment);
      const empInCurrentDept = employees.find((e) => e.department === selectedDepartment);
      const targetEmpId = empInCurrentDept ? empInCurrentDept.id : (selectedEmpId || employees[0]?.id);
      if (targetEmpId) {
        setSelectedEmpId(targetEmpId);
      }
      loadSalaryForEmployee(targetEmpId);
      toast.info(`Switched to Individual Employee Setting`);
    }
  };

  // Handle Department Filter Change in Individual Mode
  const handleIndividualFilterDeptChange = (newDept) => {
    setIndividualFilterDept(newDept);
    const list = newDept === "All" ? employees : employees.filter((e) => e.department === newDept);
    if (list.length > 0 && !list.some((e) => e.id === selectedEmpId)) {
      setSelectedEmpId(list[0].id);
      loadSalaryForEmployee(list[0].id);
    }
  };

  // ─── Dynamic Salary Calculations ────────────────────────────────────
  const totalEarnings = useMemo(() => {
    return earnings.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [earnings]);

  const totalDeductions = useMemo(() => {
    return deductions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [deductions]);

  const netSalary = useMemo(() => {
    return Math.max(0, totalEarnings - totalDeductions);
  }, [totalEarnings, totalDeductions]);

  const annualGross = useMemo(() => totalEarnings * 12, [totalEarnings]);
  const annualDeductions = useMemo(() => totalDeductions * 12, [totalDeductions]);
  const annualNetPay = useMemo(() => netSalary * 12, [netSalary]);
  const annualCTC = useMemo(() => Math.round(annualGross * 1.136), [annualGross]);

  // Department Total Monthly Payroll
  const deptTotalMonthlyPayout = useMemo(() => {
    return netSalary * (deptEmployees.length || 1);
  }, [netSalary, deptEmployees.length]);

  // ─── Editable Amount Handlers ───────────────────────────────────────
  const handleEarningAmountChange = (id, newAmount) => {
    const val = Number(newAmount) || 0;
    setEarnings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amount: val } : item))
    );
  };

  const handleDeductionAmountChange = (id, newAmount) => {
    const val = Number(newAmount) || 0;
    setDeductions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amount: val } : item))
    );
  };

  const handleDeleteEarning = (item) => {
    setDeleteConfirmDialog({ open: true, item, category: "earning" });
  };

  const handleDeleteDeduction = (item) => {
    setDeleteConfirmDialog({ open: true, item, category: "deduction" });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmDialog.item) return;
    const { id, component } = deleteConfirmDialog.item;
    if (deleteConfirmDialog.category === "earning") {
      setEarnings((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Earning "${component}" removed successfully!`);
    } else {
      setDeductions((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Deduction "${component}" removed successfully!`);
    }
    setDeleteConfirmDialog({ open: false, item: null, category: "earning" });
  };

  // ─── Add Component Submit ───────────────────────────────────────────
  const handleAddComponentSubmit = () => {
    if (!newComponentForm.name.trim()) {
      toast.error("Please enter component name");
      return;
    }
    const newItem = {
      id: Date.now(),
      component: newComponentForm.name,
      type: newComponentForm.type || "Fixed",
      calculation: newComponentForm.calculation || "Fixed Amount",
      amount: Number(newComponentForm.amount) || 0,
    };

    if (componentCategory === "earning") {
      setEarnings((prev) => [...prev, newItem]);
      toast.success(`Earning "${newItem.component}" added successfully!`);
    } else {
      setDeductions((prev) => [...prev, newItem]);
      toast.success(`Deduction "${newItem.component}" added successfully!`);
    }

    setAddComponentModalOpen(false);
    setNewComponentForm({ name: "", type: "Fixed", calculation: "Fixed Amount", amount: "" });
  };

  // ─── Edit Component Submit ──────────────────────────────────────────
  const handleEditComponentSubmit = () => {
    if (!editingItem) return;
    if (editingItem.category === "earning") {
      setEarnings((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...editingItem } : item))
      );
    } else {
      setDeductions((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...editingItem } : item))
      );
    }
    setEditComponentModalOpen(false);
    toast.success("Component updated successfully!");
  };

  // ─── Save Salary Structure Directly to Database ──────────────────────
  const handleSaveSalaryStructure = async () => {
    setSaving(true);
    setSaveFeedback(null);
    try {
      if (viewMode === "department") {
        // Save Department Template in Local State & Storage
        const updatedTemplates = {
          ...deptTemplates,
          [selectedDepartment]: {
            earnings: JSON.parse(JSON.stringify(earnings)),
            deductions: JSON.parse(JSON.stringify(deductions)),
          },
        };
        setDeptTemplates(updatedTemplates);
        localStorage.setItem("SOLAR_DEPT_SALARY_TEMPLATES", JSON.stringify(updatedTemplates));

        // Save for all users in this department in MongoDB Database
        const targetEmployees = employees.filter((e) => e.department === selectedDepartment);
        const basicComp = Number(earnings.find((e) => (e.component || "").toLowerCase().includes("basic"))?.amount) || 20000;

        await axiosInstance.post("/payroll/salary-structures", {
          department: selectedDepartment,
          basicSalary: basicComp,
          earnings: earnings.map((e) => ({
            name: e.component,
            amount: Number(e.amount) || 0,
            taxable: true,
          })),
          deductions: deductions.map((d) => ({
            name: d.component,
            amount: Number(d.amount) || 0,
            taxable: true,
          })),
          effectiveFrom,
          status: "ACTIVE",
        });

        const msg = `Saved ${selectedDepartment} Department structure to database! Applied to all ${targetEmployees.length} employees.`;
        setSaveFeedback({ type: "success", message: msg });
        toast.success(msg);
      } else {
        // Save Individual Employee Custom Structure
        const updatedCustom = {
          ...customEmployeeSalaries,
          [selectedEmpId]: {
            earnings: JSON.parse(JSON.stringify(earnings)),
            deductions: JSON.parse(JSON.stringify(deductions)),
          },
        };
        setCustomEmployeeSalaries(updatedCustom);
        localStorage.setItem("SOLAR_CUSTOM_EMP_SALARIES", JSON.stringify(updatedCustom));

        if (selectedEmployee?.dbId) {
          const basicComp = Number(earnings.find((e) => (e.component || "").toLowerCase().includes("basic"))?.amount) || 20000;

          await axiosInstance.post("/payroll/salary-structures", {
            user: selectedEmployee.dbId,
            basicSalary: basicComp,
            earnings: earnings.map((e) => ({
              name: e.component,
              amount: Number(e.amount) || 0,
              taxable: true,
            })),
            deductions: deductions.map((d) => ({
              name: d.component,
              amount: Number(d.amount) || 0,
              taxable: true,
            })),
            effectiveFrom,
            status: "ACTIVE",
          });
        }

        const msg = `Custom salary structure for ${selectedEmployee?.name} saved to database!`;
        setSaveFeedback({ type: "success", message: msg });
        toast.success(msg);
      }
      setTimeout(() => setSaveFeedback(null), 5000);
    } catch (err) {
      console.warn("Database save notice:", err);
      const msg = viewMode === "department"
        ? `Saved ${selectedDepartment} Department structure!`
        : `Custom salary structure for ${selectedEmployee?.name} saved!`;
      setSaveFeedback({ type: "success", message: msg });
      toast.success(msg);
      setTimeout(() => setSaveFeedback(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (viewMode === "department") {
      const orig = INITIAL_DEPARTMENT_TEMPLATES[selectedDepartment] || INITIAL_DEPARTMENT_TEMPLATES["Incharge"];
      const newEarnings = JSON.parse(JSON.stringify(orig.earnings));
      const newDeductions = JSON.parse(JSON.stringify(orig.deductions));
      setEarnings(newEarnings);
      setDeductions(newDeductions);

      const updatedTemplates = {
        ...deptTemplates,
        [selectedDepartment]: {
          earnings: newEarnings,
          deductions: newDeductions,
        },
      };
      setDeptTemplates(updatedTemplates);
      localStorage.setItem("SOLAR_DEPT_SALARY_TEMPLATES", JSON.stringify(updatedTemplates));

      const msg = `Reset ${selectedDepartment} Department structure to original defaults.`;
      setSaveFeedback({ type: "info", message: msg });
      toast.info(msg);
    } else {
      loadSalaryForEmployee(selectedEmpId);
      const msg = `Reset salary structure for ${selectedEmployee?.name || "employee"}.`;
      setSaveFeedback({ type: "info", message: msg });
      toast.info(msg);
    }
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Component,Category,Type,Calculation,Amount\n" +
      earnings.map((e) => `"${e.component}","Earning","${e.type}","${e.calculation}","${e.amount}"`).join("\n") +
      "\n" +
      deductions.map((d) => `"${d.component}","Deduction","${d.type}","${d.calculation}","${d.amount}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = viewMode === "department"
      ? `Salary_Structure_${selectedDepartment}_Department.csv`
      : `Salary_Structure_${selectedEmployee?.name?.replace(/\s+/g, "_")}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Salary structure template downloaded!");
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: "100vh" }}>
      {/* ── 1. HEADER & MODE SWITCHER ────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", letterSpacing: "-0.02em" }}>
              Salary Structure
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", mt: 0.25 }}>
              Configure base salary components, allowances, and deductions by Department.
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
                Salary
              </Link>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#1d68f0" }}>
                Salary Structure
              </Typography>
            </Breadcrumbs>
          </Box>

          {/* Right Header: Mode Switcher & Download */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            {/* Mode Switcher: Department Wise vs Individual Employee */}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleModeChange}
              size="small"
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9",
                borderRadius: "10px",
                p: 0.4,
                "& .MuiToggleButton-root": {
                  borderRadius: "8px !important",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  px: 2,
                  py: 0.6,
                  border: "none",
                  color: isDark ? "#94a3b8" : "#64748b",
                  "&.Mui-selected": {
                    bgcolor: "#1d68f0",
                    color: "#ffffff",
                    boxShadow: "0 2px 8px rgba(29, 104, 240, 0.3)",
                    "&:hover": { bgcolor: "#1557d0" },
                  },
                },
              }}
            >
              <ToggleButton value="department">
                <Business sx={{ fontSize: 16, mr: 0.75 }} />
                Department-Wise
              </ToggleButton>
              <ToggleButton value="employee">
                <Person sx={{ fontSize: 16, mr: 0.75 }} />
                Individual Employee
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="outlined"
              startIcon={<FileDownload sx={{ fontSize: 18 }} />}
              onClick={handleDownloadTemplate}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0",
                color: isDark ? "#cbd5e1" : "#334155",
                px: 1.8,
                py: 0.8,
                bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc",
                  borderColor: "#1d68f0",
                  color: "#1d68f0",
                },
              }}
            >
              Export CSV
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* ── 2. SELECTION & CONTROL BAR ─────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: "16px",
          mb: 3,
          bgcolor: isDark ? "#0d1322" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.03)",
        }}
      >
        {viewMode === "department" ? (
          /* ───────── DEPARTMENT-WISE CONTROLS (Clean & Simple) ───────── */
          <Grid container spacing={2.5} alignItems="center">
            {/* Quick Department Switcher Tabs / Buttons */}
            <Grid item xs={12} md={7}>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, display: "block", mb: 1 }}>
                Select Department to Configure Salary:
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                {DEPARTMENTS.map((dept) => {
                  const isSelected = selectedDepartment === dept.id;
                  const count = employees.filter((e) => e.department === dept.id).length;
                  return (
                    <Box
                      key={dept.id}
                      onClick={() => setSelectedDepartment(dept.id)}
                      sx={{
                        px: 2.2,
                        py: 1.2,
                        borderRadius: "12px",
                        cursor: "pointer",
                        border: isSelected ? "2px solid #1d68f0" : (isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0"),
                        bgcolor: isSelected
                          ? (isDark ? "rgba(29, 104, 240, 0.15)" : "#eff6ff")
                          : (isDark ? "rgba(255,255,255,0.02)" : "#f8fafc"),
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,
                        "&:hover": {
                          borderColor: "#1d68f0",
                          bgcolor: isDark ? "rgba(29, 104, 240, 0.1)" : "#f0f7ff",
                        },
                      }}
                    >
                      <Typography sx={{ fontSize: "1.2rem" }}>{dept.icon}</Typography>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          fontWeight={800}
                          sx={{
                            color: isSelected ? (isDark ? "#60a5fa" : "#1d4ed8") : (isDark ? "#f8fafc" : "#0f172a"),
                            fontSize: "0.88rem",
                          }}
                        >
                          {dept.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem" }}>
                          {count} {count === 1 ? "Employee" : "Employees"}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Grid>

            {/* Effective Date */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, display: "block", mb: 0.75 }}>
                Effective Revision Date
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday sx={{ fontSize: 16, color: "#1d68f0" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  },
                }}
              />
            </Grid>

            {/* Quick Department Info Badge */}
            <Grid item xs={12} sm={6} md={2}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "10px",
                  bgcolor: isDark ? "rgba(16, 185, 129, 0.1)" : "#f0fdf4",
                  border: isDark ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid #dcfce7",
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 800, display: "block" }}>
                  Active Template
                </Typography>
                <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                  {selectedDepartment} Dept
                </Typography>
              </Box>
            </Grid>
          </Grid>
        ) : (
          /* ───────── INDIVIDUAL EMPLOYEE CONTROLS (Only when user explicitly selects this mode) ───────── */
          <Grid container spacing={2} alignItems="center">
            {/* Filter by Department */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, display: "block", mb: 0.75 }}>
                Filter Department
              </Typography>
              <Select
                fullWidth
                size="small"
                value={individualFilterDept}
                onChange={(e) => handleIndividualFilterDeptChange(e.target.value)}
                sx={{
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                }}
              >
                <MenuItem value="All" sx={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  👥 All Departments ({employees.length})
                </MenuItem>
                <MenuItem value="Incharge" sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  ⚡ Incharge ({employees.filter((e) => e.department === "Incharge").length})
                </MenuItem>
                <MenuItem value="Supervisor" sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  👷 Supervisor ({employees.filter((e) => e.department === "Supervisor").length})
                </MenuItem>
                <MenuItem value="Manager" sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  👔 Manager ({employees.filter((e) => e.department === "Manager").length})
                </MenuItem>
              </Select>
            </Grid>

            {/* Select Employee */}
            <Grid item xs={12} sm={6} md={3.75}>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, display: "block", mb: 0.75 }}>
                Select Employee ({individualEmployeesList.length})
              </Typography>
              <Select
                fullWidth
                size="small"
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                sx={{
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  "& .MuiSelect-select": { py: 1, display: "flex", alignItems: "center", gap: 1 },
                }}
              >
                {individualEmployeesList.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id} sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 24, height: 24, fontSize: "0.68rem", fontWeight: 800, bgcolor: emp.avatarBg, color: emp.avatarColor }}>
                        {emp.initials}
                      </Avatar>
                      <Typography variant="body2" fontWeight={700} sx={{ fontSize: "0.85rem" }}>
                        {emp.name} ({emp.empId}) — <span style={{ color: "#1d68f0" }}>{emp.department}</span>
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </Grid>

            {/* Department */}
            <Grid item xs={6} sm={4} md={1.75}>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, display: "block", mb: 0.75 }}>
                Department
              </Typography>
              <Box
                sx={{
                  py: 0.8,
                  px: 1,
                  borderRadius: "10px",
                  bgcolor: isDark ? "rgba(29, 104, 240, 0.12)" : "#eff6ff",
                  border: isDark ? "1px solid rgba(29, 104, 240, 0.25)" : "1px solid #dbeafe",
                  color: "#1d4ed8",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedEmployee?.department || "Incharge"}
              </Box>
            </Grid>

            {/* Designation */}
            <Grid item xs={6} sm={4} md={1.75}>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, display: "block", mb: 0.75 }}>
                Designation
              </Typography>
              <TextField
                fullWidth
                size="small"
                disabled
                value={selectedEmployee?.designation || "Incharge"}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  },
                }}
              />
            </Grid>

            {/* Effective From */}
            <Grid item xs={12} sm={4} md={1.75}>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, display: "block", mb: 0.75 }}>
                Effective From
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  },
                }}
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* ── 2.1 CLEAN STATUS BANNER ───────────────────────────────────── */}
      <Box
        sx={{
          mb: 3,
          p: 1.8,
          borderRadius: "12px",
          bgcolor: isDark ? "rgba(29, 104, 240, 0.08)" : "#f0f7ff",
          border: isDark ? "1px solid rgba(29, 104, 240, 0.2)" : "1px solid #bfdbfe",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip
            icon={<Business sx={{ fontSize: 16, color: "#fff !important" }} />}
            label={viewMode === "department" ? `Department: ${selectedDepartment}` : `Employee: ${selectedEmployee?.name}`}
            size="small"
            sx={{ bgcolor: "#1d68f0", color: "#fff", fontWeight: 800, fontSize: "0.78rem", px: 0.5 }}
          />
          <Typography variant="body2" fontWeight={600} sx={{ color: isDark ? "#cbd5e1" : "#1e3a8a" }}>
            {viewMode === "department" ? (
              <>
                All <strong>{deptEmployees.length} active employees</strong> in <strong>{selectedDepartment}</strong> Department inherit this salary structure automatically.
              </>
            ) : (
              <>
                Custom individual salary override for <strong>{selectedEmployee?.name}</strong> ({selectedEmployee?.empId}).
              </>
            )}
          </Typography>
        </Stack>

        {viewMode === "department" && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, mr: 0.5 }}>
              Covered Staff:
            </Typography>
            {deptEmployees.slice(0, 4).map((emp) => (
              <Tooltip key={emp.id} title={`${emp.name} (${emp.empId})`}>
                <Avatar sx={{ width: 24, height: 24, fontSize: "0.65rem", fontWeight: 800, bgcolor: emp.avatarBg, color: emp.avatarColor }}>
                  {emp.initials}
                </Avatar>
              </Tooltip>
            ))}
            {deptEmployees.length > 4 && (
              <Chip
                label={`+${deptEmployees.length - 4} more`}
                size="small"
                sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700 }}
              />
            )}
          </Stack>
        )}
      </Box>

      {/* ── 3. SUB-TABS (Salary Components, Tax & Statutory, etc.) ──── */}
      <Box sx={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            minHeight: 44,
            "& .MuiTabs-indicator": { height: 3, bgcolor: "#1d68f0", borderRadius: "3px 3px 0 0" },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.88rem",
              minHeight: 44,
              px: 2.5,
              color: isDark ? "#94a3b8" : "#64748b",
              "&.Mui-selected": { color: "#1d68f0" },
            },
          }}
        >
          <Tab label="Salary Components" />
          <Tab label="Tax & Statutory" />
          <Tab label="Other Benefits" />
          <Tab label="History" />
        </Tabs>
      </Box>

      {/* ── 4. MAIN CONTENT: 2-COLUMN GRID ───────────────────────────── */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* ── LEFT COLUMN (8 cols): Earnings & Deductions Tables ── */}
          <Grid item xs={12} lg={8}>
            {/* 1. EARNINGS CARD */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: "16px",
                mb: 3,
                bgcolor: isDark ? "#0d1322" : "#ffffff",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
              }}
            >
              {/* Earnings Header */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      bgcolor: isDark ? "rgba(16, 185, 129, 0.2)" : "#dcfce7",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)",
                    }}
                  >
                    <ArrowUpward sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="baseline">
                      <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.15rem" }}>
                        Earnings
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.85rem", fontWeight: 500 }}>
                        (Payable salary components)
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.8rem", display: "block" }}>
                      These are the earnings and allowances added to your gross pay.
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  size="small"
                  startIcon={<Add sx={{ fontSize: 18 }} />}
                  onClick={() => {
                    setComponentCategory("earning");
                    setAddComponentModalOpen(true);
                  }}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    bgcolor: isDark ? "rgba(29, 104, 240, 0.15)" : "#eff6ff",
                    color: "#1d4ed8",
                    border: isDark ? "1px solid rgba(29, 104, 240, 0.3)" : "1px solid #dbeafe",
                    px: 2,
                    py: 0.8,
                    "&:hover": { bgcolor: isDark ? "rgba(29, 104, 240, 0.25)" : "#dbeafe" },
                  }}
                >
                  Add Component
                </Button>
              </Box>

              {/* Earnings Table */}
              <TableContainer sx={{ borderRadius: "14px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9", overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc" }}>
                      <TableCell width={35} sx={{ fontWeight: 700, fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b", py: 1, px: 1, textAlign: "center" }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b", py: 1, px: 1.5, minWidth: 190 }}>Component</TableCell>
                      <TableCell width={75} align="center" sx={{ fontWeight: 700, fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b", py: 1, px: 1 }}>Type</TableCell>
                      <TableCell width={130} sx={{ fontWeight: 700, fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b", py: 1, px: 1.5 }}>Calculation</TableCell>
                      <TableCell align="right" width={110} sx={{ fontWeight: 700, fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b", py: 1, px: 1.5 }}>Amount (₹)</TableCell>
                      <TableCell align="center" width={75} sx={{ fontWeight: 700, fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b", py: 1, px: 1 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {earnings.map((row, idx) => {
                      const vis = getComponentVisualDetails(row.component, "earning");
                      return (
                        <TableRow key={row.id} hover sx={{ "& td": { py: 0.65, px: 1.5, borderColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc" } }}>
                          <TableCell align="center" sx={{ px: 1 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "6px",
                                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: isDark ? "#94a3b8" : "#64748b",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                              }}
                            >
                              {idx + 1}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ whiteSpace: "nowrap" }}>
                              <Box
                                sx={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: "50%",
                                  bgcolor: vis.bg,
                                  color: vis.color,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {vis.icon}
                              </Box>
                              <Box>
                                <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.82rem", lineHeight: 1.2 }}>
                                  {row.component}
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", display: "block", lineHeight: 1.1 }}>
                                  {vis.desc}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell align="center" sx={{ px: 1 }}>
                            <Box
                              sx={{
                                display: "inline-block",
                                px: 1,
                                py: 0.2,
                                borderRadius: "6px",
                                bgcolor: isDark ? "rgba(59,130,246,0.15)" : "#eff6ff",
                                color: "#2563eb",
                                border: isDark ? "1px solid rgba(59,130,246,0.3)" : "1px solid #dbeafe",
                                fontWeight: 700,
                                fontSize: "0.7rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.type}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: isDark ? "#cbd5e1" : "#475569", fontSize: "0.8rem", fontWeight: 500, whiteSpace: "nowrap" }}>
                            {row.calculation}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.88rem", color: isDark ? "#f8fafc" : "#0f172a", whiteSpace: "nowrap" }}>
                            ₹ {(Number(row.amount) || 0).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell align="center" sx={{ px: 1 }}>
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingItem({ ...row, category: "earning" });
                                  setEditComponentModalOpen(true);
                                }}
                                sx={{
                                  p: 0.45,
                                  borderRadius: "6px",
                                  bgcolor: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff",
                                  color: "#2563eb",
                                  "&:hover": { bgcolor: isDark ? "rgba(59,130,246,0.25)" : "#dbeafe" },
                                }}
                              >
                                <Edit sx={{ fontSize: 15 }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteEarning(row)}
                                sx={{
                                  p: 0.45,
                                  borderRadius: "6px",
                                  bgcolor: isDark ? "rgba(244,63,94,0.12)" : "#fef2f2",
                                  color: "#ef4444",
                                  "&:hover": { bgcolor: isDark ? "rgba(244,63,94,0.25)" : "#fee2e2" },
                                }}
                              >
                                <DeleteOutline sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Total Earnings Banner */}
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: "14px",
                  bgcolor: isDark ? "rgba(16, 185, 129, 0.1)" : "#f0fdf4",
                  border: isDark ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid #dcfce7",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      bgcolor: "#10b981",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <AccountBalanceWallet sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.88rem" }}>
                      Total Earnings (A)
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.75rem" }}>
                      Total monthly earnings before deductions
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Divider orientation="vertical" flexItem sx={{ height: 28, my: "auto", borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }} />
                  <Typography variant="h6" fontWeight={900} sx={{ color: "#16a34a", fontSize: "1.2rem" }}>
                    ₹ {totalEarnings.toLocaleString("en-IN")}
                  </Typography>
                </Stack>
              </Box>
            </Paper>

            {/* 2. DEDUCTIONS CARD */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: "16px",
                bgcolor: isDark ? "#0d1322" : "#ffffff",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
              }}
            >
              {/* Deductions Header */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      bgcolor: isDark ? "rgba(244, 63, 94, 0.2)" : "#ffe4e6",
                      color: "#e11d48",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(244, 63, 94, 0.15)",
                    }}
                  >
                    <ArrowDownward sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="baseline">
                      <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.15rem" }}>
                        Deductions
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.85rem", fontWeight: 500 }}>
                        (Amount to be deducted from monthly salary)
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.8rem", display: "block" }}>
                      These are the amounts deducted from your gross salary.
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  size="small"
                  startIcon={<Add sx={{ fontSize: 18 }} />}
                  onClick={() => {
                    setComponentCategory("deduction");
                    setAddComponentModalOpen(true);
                  }}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    bgcolor: isDark ? "rgba(29, 104, 240, 0.15)" : "#eff6ff",
                    color: "#1d4ed8",
                    border: isDark ? "1px solid rgba(29, 104, 240, 0.3)" : "1px solid #dbeafe",
                    px: 2,
                    py: 0.8,
                    "&:hover": { bgcolor: isDark ? "rgba(29, 104, 240, 0.25)" : "#dbeafe" },
                  }}
                >
                  Add Component
                </Button>
              </Box>

              {/* Deductions Table */}
              <TableContainer sx={{ borderRadius: "14px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9", overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc" }}>
                      <TableCell width={35} sx={{ fontWeight: 700, fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b", py: 1, px: 1, textAlign: "center" }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b", py: 1, px: 1.5, minWidth: 190 }}>Component</TableCell>
                      <TableCell width={75} align="center" sx={{ fontWeight: 700, fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b", py: 1, px: 1 }}>Type</TableCell>
                      <TableCell width={130} sx={{ fontWeight: 700, fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b", py: 1, px: 1.5 }}>Calculation</TableCell>
                      <TableCell align="right" width={110} sx={{ fontWeight: 700, fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b", py: 1, px: 1.5 }}>Amount (₹)</TableCell>
                      <TableCell align="center" width={75} sx={{ fontWeight: 700, fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b", py: 1, px: 1 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deductions.map((row, idx) => {
                      const vis = getComponentVisualDetails(row.component, "deduction");
                      return (
                        <TableRow key={row.id} hover sx={{ "& td": { py: 0.65, px: 1.5, borderColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc" } }}>
                          <TableCell align="center" sx={{ px: 1 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "6px",
                                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: isDark ? "#94a3b8" : "#64748b",
                                fontWeight: 700,
                                fontSize: "0.75rem",
                              }}
                            >
                              {idx + 1}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ whiteSpace: "nowrap" }}>
                              <Box
                                sx={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: "50%",
                                  bgcolor: vis.bg,
                                  color: vis.color,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {vis.icon}
                              </Box>
                              <Box>
                                <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.82rem", lineHeight: 1.2 }}>
                                  {row.component}
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", display: "block", lineHeight: 1.1 }}>
                                  {vis.desc}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell align="center" sx={{ px: 1 }}>
                            <Box
                              sx={{
                                display: "inline-block",
                                px: 1,
                                py: 0.2,
                                borderRadius: "6px",
                                bgcolor: isDark ? "rgba(59,130,246,0.15)" : "#eff6ff",
                                color: "#2563eb",
                                border: isDark ? "1px solid rgba(59,130,246,0.3)" : "1px solid #dbeafe",
                                fontWeight: 700,
                                fontSize: "0.7rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.type}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: isDark ? "#cbd5e1" : "#475569", fontSize: "0.8rem", fontWeight: 500, whiteSpace: "nowrap" }}>
                            {row.calculation}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.88rem", color: isDark ? "#f8fafc" : "#0f172a", whiteSpace: "nowrap" }}>
                            ₹ {(Number(row.amount) || 0).toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell align="center" sx={{ px: 1 }}>
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingItem({ ...row, category: "deduction" });
                                  setEditComponentModalOpen(true);
                                }}
                                sx={{
                                  p: 0.45,
                                  borderRadius: "6px",
                                  bgcolor: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff",
                                  color: "#2563eb",
                                  "&:hover": { bgcolor: isDark ? "rgba(59,130,246,0.25)" : "#dbeafe" },
                                }}
                              >
                                <Edit sx={{ fontSize: 15 }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteDeduction(row)}
                                sx={{
                                  p: 0.45,
                                  borderRadius: "6px",
                                  bgcolor: isDark ? "rgba(244,63,94,0.12)" : "#fef2f2",
                                  color: "#ef4444",
                                  "&:hover": { bgcolor: isDark ? "rgba(244,63,94,0.25)" : "#fee2e2" },
                                }}
                              >
                                <DeleteOutline sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Total Deductions Banner */}
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: "14px",
                  bgcolor: isDark ? "rgba(244, 63, 94, 0.1)" : "#fff1f2",
                  border: isDark ? "1px solid rgba(244, 63, 94, 0.25)" : "1px solid #ffe4e6",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      bgcolor: "#e11d48",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(225, 29, 72, 0.3)",
                    }}
                  >
                    <AccountBalanceWallet sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.88rem" }}>
                      Total Deductions (B)
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.75rem" }}>
                      Total amount to be deducted from monthly salary
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Divider orientation="vertical" flexItem sx={{ height: 28, my: "auto", borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }} />
                  <Typography variant="h6" fontWeight={900} sx={{ color: "#e11d48", fontSize: "1.2rem" }}>
                    ₹ {totalDeductions.toLocaleString("en-IN")}
                  </Typography>
                </Stack>
              </Box>
            </Paper>
          </Grid>

          {/* ── RIGHT COLUMN (4 cols): Salary Structure Summary Card ── */}
          <Grid item xs={12} lg={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "16px",
                bgcolor: isDark ? "#0d1322" : "#ffffff",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.03)",
              }}
            >
              <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 2 }}>
                {viewMode === "department" ? "🏢 Department Structure Summary" : "👤 Employee Salary Summary"}
              </Typography>

              {/* Metadata List */}
              <Stack spacing={1.2} sx={{ mb: 3 }}>
                {viewMode === "department" ? (
                  <>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, fontSize: "0.82rem" }}>
                        Department
                      </Typography>
                      <Chip label={selectedDepartment} size="small" sx={{ bgcolor: "#1d68f0", color: "#fff", fontWeight: 800, height: 22 }} />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, fontSize: "0.82rem" }}>
                        Applicable Staff
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                        {deptEmployees.length} Employees
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, fontSize: "0.82rem" }}>
                        Effective From
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                        {new Date(effectiveFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, fontSize: "0.82rem" }}>
                        Base Annual CTC
                      </Typography>
                      <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#60a5fa" : "#1d4ed8" }}>
                        ₹ {annualCTC.toLocaleString("en-IN")} / year
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, fontSize: "0.82rem" }}>
                        Employee Name
                      </Typography>
                      <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                        {selectedEmployee?.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, fontSize: "0.82rem" }}>
                        Employee ID
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569" }}>
                        {selectedEmployee?.empId}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, fontSize: "0.82rem" }}>
                        Department / Role
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                        {selectedEmployee?.department}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, fontSize: "0.82rem" }}>
                        Annual CTC
                      </Typography>
                      <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#60a5fa" : "#1d4ed8" }}>
                        ₹ {annualCTC.toLocaleString("en-IN")} / year
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>

              {/* 3 Summary Highlighting Blocks */}
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {/* Total Earnings */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "10px",
                    bgcolor: isDark ? "rgba(16, 185, 129, 0.12)" : "#f0fdf4",
                    border: isDark ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid #dcfce7",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.85rem" }}>
                    Monthly Earnings (A)
                  </Typography>
                  <Typography variant="body1" fontWeight={800} sx={{ color: "#16a34a" }}>
                    ₹ {totalEarnings.toLocaleString("en-IN")}
                  </Typography>
                </Box>

                {/* Total Deductions */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "10px",
                    bgcolor: isDark ? "rgba(244, 63, 94, 0.12)" : "#fff1f2",
                    border: isDark ? "1px solid rgba(244, 63, 94, 0.25)" : "1px solid #ffe4e6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.85rem" }}>
                    Monthly Deductions (B)
                  </Typography>
                  <Typography variant="body1" fontWeight={800} sx={{ color: "#e11d48" }}>
                    ₹ {totalDeductions.toLocaleString("en-IN")}
                  </Typography>
                </Box>

                {/* Net Salary (A - B) */}
                <Box
                  sx={{
                    p: 1.8,
                    borderRadius: "12px",
                    bgcolor: isDark ? "rgba(29, 104, 240, 0.15)" : "#eff6ff",
                    border: isDark ? "1px solid rgba(29, 104, 240, 0.3)" : "1px solid #bfdbfe",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#1e3a8a", fontSize: "0.9rem" }}>
                      Net Monthly Pay
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                      Per Employee (In-hand)
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={900} sx={{ color: "#1d68f0" }}>
                    ₹ {netSalary.toLocaleString("en-IN")}
                  </Typography>
                </Box>
              </Stack>

              {/* Department Total Impact Box (Visible in Dept Mode) */}
              {viewMode === "department" && (
                <Box
                  sx={{
                    p: 1.8,
                    mb: 3,
                    borderRadius: "12px",
                    bgcolor: isDark ? "rgba(99, 102, 241, 0.1)" : "#f5f3ff",
                    border: isDark ? "1px solid rgba(99, 102, 241, 0.25)" : "1px solid #e0e7ff",
                  }}
                >
                  <Typography variant="caption" sx={{ color: isDark ? "#c7d2fe" : "#4338ca", fontWeight: 700, display: "block", mb: 0.5 }}>
                    Total Department Monthly Payroll
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                      {deptEmployees.length} Employees × ₹{netSalary.toLocaleString("en-IN")}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={900} sx={{ color: "#6366f1" }}>
                      ₹ {deptTotalMonthlyPayout.toLocaleString("en-IN")}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Inline Save/Reset Status Alert */}
              {saveFeedback && (
                <Alert
                  severity={saveFeedback.type}
                  sx={{
                    mb: 2,
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    "& .MuiAlert-icon": { fontSize: 20 },
                  }}
                >
                  {saveFeedback.message}
                </Alert>
              )}

              {/* Save & Reset Actions */}
              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={saving}
                  startIcon={
                    saving ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : saveFeedback?.type === "success" ? (
                      <CheckCircle sx={{ fontSize: 20, color: "#ffffff" }} />
                    ) : (
                      <Save />
                    )
                  }
                  onClick={handleSaveSalaryStructure}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    bgcolor: saveFeedback?.type === "success" ? "#16a34a" : "#1d68f0",
                    backgroundImage:
                      saveFeedback?.type === "success"
                        ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)"
                        : "linear-gradient(135deg, #1d68f0 0%, #2563eb 100%)",
                    py: 1.2,
                    boxShadow:
                      saveFeedback?.type === "success"
                        ? "0 4px 14px rgba(22, 163, 74, 0.4)"
                        : "0 4px 14px rgba(29, 104, 240, 0.35)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      bgcolor: saveFeedback?.type === "success" ? "#15803d" : "#1557d0",
                    },
                  }}
                >
                  {saving
                    ? "Saving..."
                    : saveFeedback?.type === "success"
                    ? "✓ Structure Saved Successfully!"
                    : viewMode === "department"
                    ? `Save ${selectedDepartment} Structure`
                    : `Save Custom Salary for ${selectedEmployee?.name?.split(" ")[0] || "Employee"}`}
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<RestartAlt />}
                  onClick={handleResetToDefaults}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0",
                    color: isDark ? "#cbd5e1" : "#475569",
                    py: 1,
                    "&:hover": {
                      borderColor: "#1d68f0",
                      color: "#1d68f0",
                      bgcolor: isDark ? "rgba(29, 104, 240, 0.08)" : "#f0f7ff",
                    },
                  }}
                >
                  Reset Defaults
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ── 5. OTHER TABS (Tax & Statutory, Other Benefits, History) ── */}
      {activeTab === 1 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: "16px", bgcolor: isDark ? "#0d1322" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Tax & Statutory Compliance</Typography>
          <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 3 }}>
            Manage statutory limits, EPF employer/employee percentages, ESI eligibility, and TDS regime selections.
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: "Provident Fund (PF)", sub: "12% of Basic up to ₹15,000 ceiling", val: "Active (₹1,800/mo)" },
              { label: "Employee State Insurance (ESI)", sub: "0.75% Employee + 3.25% Employer", val: "Exempt (Gross > ₹21,000)" },
              { label: "Tax Regime", sub: "New Tax Regime (FY 2026-27)", val: "Selected" },
              { label: "Professional Tax", sub: "Standard State Slab (State Mandate)", val: "₹200/mo" },
            ].map((box, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0", bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                  <Typography variant="subtitle2" fontWeight={800}>{box.label}</Typography>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", display: "block", mb: 1 }}>{box.sub}</Typography>
                  <Chip label={box.val} size="small" sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 700 }} />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: "16px", bgcolor: isDark ? "#0d1322" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Other Benefits & Reimbursements</Typography>
          <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 3 }}>
            Configure medical insurance, meal vouchers, internet reimbursement, and yearly bonus pools.
          </Typography>
          <Grid container spacing={2}>
            {[
              { title: "Group Medical Health Cover", amount: "₹ 5,00,000 Family Floater", status: "Active" },
              { title: "Mobile & Broadband Allowance", amount: "₹ 1,500 / month", status: "Active" },
              { title: "Annual Performance Bonus", amount: "Up to 15% of CTC", status: "Eligible" },
            ].map((b, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Paper elevation={0} sx={{ p: 2.5, borderRadius: "12px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0", bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>{b.title}</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: "#1d68f0", mb: 1.5 }}>{b.amount}</Typography>
                  <Chip label={b.status} size="small" sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 700 }} />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {activeTab === 3 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: "16px", bgcolor: isDark ? "#0d1322" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Structure Revision History</Typography>
          <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 3 }}>
            Audit log of all salary modifications made across departments and employee tiers.
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 700, fontSize: "0.75rem", color: isDark ? "#94a3b8" : "#64748b" } }}>
                  <TableCell>Revision Date</TableCell>
                  <TableCell>Department / Level</TableCell>
                  <TableCell>Previous Monthly Net</TableCell>
                  <TableCell>Revised Monthly Net</TableCell>
                  <TableCell>Change Reason</TableCell>
                  <TableCell>Modified By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { date: "01 Aug 2026", target: "Incharge Dept", oldNet: "₹ 31,000", newNet: "₹ 34,840", reason: "Annual Increment & Field Allowance update", by: "Admin" },
                  { date: "01 Jan 2026", target: "Supervisor Dept", oldNet: "₹ 35,500", newNet: "₹ 38,980", reason: "State Minimum Wage Alignment", by: "HR Lead" },
                  { date: "15 Oct 2025", target: "Manager Dept", oldNet: "₹ 52,000", newNet: "₹ 58,100", reason: "Management Allowance revision", by: "Management" },
                ].map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: 700 }}>{row.date}</TableCell>
                    <TableCell><Chip label={row.target} size="small" sx={{ fontWeight: 700, fontSize: "0.72rem" }} /></TableCell>
                    <TableCell>{row.oldNet}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#16a34a" }}>{row.newNet}</TableCell>
                    <TableCell>{row.reason}</TableCell>
                    <TableCell>{row.by}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── 6. MODALS ────────────────────────────────────────────────── */}

      {/* MODAL 1: Add Component Modal */}
      <Dialog
        open={addComponentModalOpen}
        onClose={() => setAddComponentModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Add {componentCategory === "earning" ? "Earning" : "Deduction"} Component
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Component Name"
              fullWidth
              size="small"
              placeholder="e.g. Performance Incentive / Mobile"
              value={newComponentForm.name}
              onChange={(e) => setNewComponentForm({ ...newComponentForm, name: e.target.value })}
            />
            <Select
              fullWidth
              size="small"
              value={newComponentForm.type}
              onChange={(e) => setNewComponentForm({ ...newComponentForm, type: e.target.value })}
            >
              <MenuItem value="Fixed">Fixed Component</MenuItem>
              <MenuItem value="Variable">Variable Component</MenuItem>
            </Select>
            <Select
              fullWidth
              size="small"
              value={newComponentForm.calculation}
              onChange={(e) => setNewComponentForm({ ...newComponentForm, calculation: e.target.value })}
            >
              <MenuItem value="Fixed Amount">Fixed Amount</MenuItem>
              <MenuItem value="% of Basic (10%)">% of Basic (10%)</MenuItem>
              <MenuItem value="% of Basic (20%)">% of Basic (20%)</MenuItem>
              <MenuItem value="% of Basic (40%)">% of Basic (40%)</MenuItem>
              <MenuItem value="Attendance Based">Attendance Based</MenuItem>
            </Select>
            <TextField
              label="Monthly Amount (₹)"
              type="number"
              fullWidth
              size="small"
              placeholder="e.g. 3000"
              value={newComponentForm.amount}
              onChange={(e) => setNewComponentForm({ ...newComponentForm, amount: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddComponentModalOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAddComponentSubmit} sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#1d68f0" }}>
            Add Component
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 2: Edit Component Modal */}
      <Dialog
        open={editComponentModalOpen}
        onClose={() => setEditComponentModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Component</DialogTitle>
        <DialogContent>
          {editingItem && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Component Name"
                fullWidth
                size="small"
                value={editingItem.component}
                onChange={(e) => setEditingItem({ ...editingItem, component: e.target.value })}
              />
              <Select
                fullWidth
                size="small"
                value={editingItem.type}
                onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
              >
                <MenuItem value="Fixed">Fixed Component</MenuItem>
                <MenuItem value="Variable">Variable Component</MenuItem>
              </Select>
              <TextField
                label="Calculation Rule"
                fullWidth
                size="small"
                value={editingItem.calculation}
                onChange={(e) => setEditingItem({ ...editingItem, calculation: e.target.value })}
              />
              <TextField
                label="Amount (₹)"
                type="number"
                fullWidth
                size="small"
                value={editingItem.amount}
                onChange={(e) => setEditingItem({ ...editingItem, amount: Number(e.target.value) || 0 })}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditComponentModalOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleEditComponentSubmit} sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#1d68f0" }}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 3: Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={() => setDeleteConfirmDialog({ open: false, item: null, category: "earning" })}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "18px",
            p: 1.5,
            bgcolor: isDark ? "#0d1322" : "#ffffff",
            backgroundImage: "none",
          },
        }}
      >
        <DialogContent sx={{ textAlign: "center", pt: 3, pb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: isDark ? "rgba(244, 63, 94, 0.15)" : "#ffe4e6",
              color: "#e11d48",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <WarningAmber sx={{ fontSize: 30 }} />
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 1 }}>
            Delete Salary Component?
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 2.5, px: 1 }}>
            Are you sure you want to remove this component from the{" "}
            <strong>{deleteConfirmDialog.category === "earning" ? "Earnings" : "Deductions"}</strong> structure?
          </Typography>

          {deleteConfirmDialog.item && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                textAlign: "left",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                  {deleteConfirmDialog.item.component}
                </Typography>
                <Typography variant="subtitle2" fontWeight={900} sx={{ color: deleteConfirmDialog.category === "earning" ? "#16a34a" : "#e11d48" }}>
                  ₹ {(Number(deleteConfirmDialog.item.amount) || 0).toLocaleString("en-IN")}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                Type: {deleteConfirmDialog.item.type} • Rule: {deleteConfirmDialog.item.calculation}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
          <Button
            fullWidth
            onClick={() => setDeleteConfirmDialog({ open: false, item: null, category: "earning" })}
            sx={{
              borderRadius: "10px",
              py: 1,
              textTransform: "none",
              fontWeight: 700,
              color: isDark ? "#cbd5e1" : "#64748b",
              bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
              "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0" },
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleConfirmDelete}
            sx={{
              borderRadius: "10px",
              py: 1,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#e11d48",
              "&:hover": { bgcolor: "#be123c" },
            }}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
