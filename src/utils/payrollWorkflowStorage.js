// ─── Shared Payroll & Salary Slip Workflow Storage Engine ─────────────────────
// Provides consistent status tracking, formula calculation, and persistence across Payroll & Payslips pages.

export const PAYROLL_STATUS = {
  NOT_PROCESSED: "NOT_PROCESSED",
  READY: "READY",
  FINALIZED: "FINALIZED",
};

export const EMPLOYEE_PAYROLL_STATUS = {
  PENDING: "Pending",
  READY: "Ready",
  FINALIZED: "Finalized",
};

export const PAYMENT_STATUS = {
  PENDING: "Pending",
  PAID: "Paid",
};

export const SLIP_STATUS = {
  NOT_GENERATED: "Not Generated",
  GENERATED: "Generated",
  NEEDS_REGENERATION: "Needs Regeneration",
};

// Helper: Get available payroll months dynamically up to current month (no future months)
export function getAvailablePayrollMonths(count = 12) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString("en-US", { month: "long" });
    const year = d.getFullYear();
    months.push(`${monthName} ${year}`);
  }
  return months;
}

// Helper: Current active payroll month
export function getCurrentPayrollMonth() {
  const now = new Date();
  return `${now.toLocaleString("en-US", { month: "long" })} ${now.getFullYear()}`;
}

// Helper: Calculate exact Month Period starting from day 1 (e.g. 1 Aug 2026 - 31 Aug 2026)
export function getMonthPeriodDetails(monthStr) {
  const defaultCurrent = getCurrentPayrollMonth();
  const parts = String(monthStr || defaultCurrent).trim().split(" ");
  const monthName = parts[0] || "August";
  const year = parseInt(parts[1], 10) || 2026;

  const monthIndexMap = {
    january: 0, jan: 0,
    february: 1, feb: 1,
    march: 2, mar: 2,
    april: 3, apr: 3,
    may: 4,
    june: 5, jun: 5,
    july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sep: 8, sept: 8,
    october: 9, oct: 9,
    november: 10, nov: 10,
    december: 11, dec: 11,
  };

  const mIdx = monthIndexMap[monthName.toLowerCase()] ?? 7;
  const lastDay = new Date(year, mIdx + 1, 0).getDate();
  const shortMonth = new Date(year, mIdx, 1).toLocaleString("en-US", { month: "short" });
  const nextMonthName = new Date(year, mIdx + 1, 5).toLocaleString("en-US", { month: "short" });
  const nextMonthYear = new Date(year, mIdx + 1, 5).getFullYear();

  return {
    totalDays: lastDay,
    shortMonth,
    year,
    payPeriod: `1 ${shortMonth} ${year} - ${lastDay} ${shortMonth} ${year}`,
    defaultGeneratedDate: `05 ${nextMonthName} ${nextMonthYear}`,
  };
}

// Default Roster if no backend users exist
export const DEFAULT_HRMS_ROSTER = [
  {
    id: 1,
    name: "rahul roy",
    empId: "E0002",
    department: "Incharge",
    designation: "ZSM",
    joiningDate: "6 Aug 2026",
    bank: "State Bank of India (•••• 7890)",
    pan: "ABCPD1234F",
    ifsc: "SBIN0001234",
    accountNo: "XXXX XXXX 7890",
    avatarBg: "#dbeafe",
    avatarColor: "#1d4ed8",
    initials: "RR",
    attendance: { totalDays: 31, presentDays: 31, absentDays: 0, leavePaid: 0, leaveUnpaid: 0, holidays: 0 },
  },
  {
    id: 2,
    name: "incharge demo",
    empId: "I0015",
    department: "Incharge",
    designation: "Technical Incharge",
    joiningDate: "6 Aug 2026",
    bank: "State Bank of India (•••• 7890)",
    pan: "ABCPD1234F",
    ifsc: "SBIN0001234",
    accountNo: "XXXX XXXX 7890",
    avatarBg: "#fef3c7",
    avatarColor: "#b45309",
    initials: "ID",
    attendance: { totalDays: 31, presentDays: 30, absentDays: 1, leavePaid: 0, leaveUnpaid: 0, holidays: 0 },
  },
  {
    id: 3,
    name: "360 Connect",
    empId: "E0003",
    department: "Manager",
    designation: "Operations Lead",
    joiningDate: "15 Feb 2024",
    bank: "HDFC Bank (•••• 5521)",
    pan: "PQRSK5678L",
    ifsc: "HDFC0000451",
    accountNo: "XXXX XXXX 5521",
    avatarBg: "#e2e8f0",
    avatarColor: "#475569",
    initials: "3C",
    attendance: { totalDays: 31, presentDays: 30, absentDays: 1, leavePaid: 0, leaveUnpaid: 0, holidays: 0 },
  },
  {
    id: 4,
    name: "ABHILASH SAMAL",
    empId: "I0018",
    department: "Incharge",
    designation: "Site Incharge",
    joiningDate: "12 Jan 2024",
    bank: "HDFC Bank (•••• 4512)",
    pan: "ABCDE1234F",
    ifsc: "HDFC0001234",
    accountNo: "XXXX XXXX 4512",
    avatarBg: "#dbeafe",
    avatarColor: "#1d4ed8",
    initials: "AS",
    attendance: { totalDays: 31, presentDays: 31, absentDays: 0, leavePaid: 0, leaveUnpaid: 0, holidays: 0 },
  },
  {
    id: 5,
    name: "SUBHARANJAN ROUTRAY",
    empId: "I0017",
    department: "Incharge",
    designation: "Electrical Incharge",
    joiningDate: "15 Mar 2023",
    bank: "ICICI Bank (•••• 8821)",
    pan: "PQRSK5678L",
    ifsc: "ICIC0000882",
    accountNo: "XXXX XXXX 8821",
    avatarBg: "#e2e8f0",
    avatarColor: "#475569",
    initials: "SR",
    attendance: { totalDays: 31, presentDays: 31, absentDays: 0, leavePaid: 0, leaveUnpaid: 0, holidays: 0 },
  },
  {
    id: 6,
    name: "SANJAY KUMAR",
    empId: "S0012",
    department: "Supervisor",
    designation: "Field Supervisor",
    joiningDate: "14 Apr 2024",
    bank: "SBI Bank (•••• 5501)",
    pan: "GHIJK6789S",
    ifsc: "SBIN0005501",
    accountNo: "XXXX XXXX 5501",
    avatarBg: "#f3e8ff",
    avatarColor: "#7e22ce",
    initials: "SK",
    attendance: { totalDays: 31, presentDays: 31, absentDays: 0, leavePaid: 0, leaveUnpaid: 0, holidays: 0 },
  },
];

// Helper to get active configured salary structure for an employee
export function getSavedSalaryStructure(emp) {
  let customMap = {};
  try {
    const raw = localStorage.getItem("SOLAR_CUSTOM_EMP_SALARIES");
    if (raw) customMap = JSON.parse(raw);
  } catch (e) {}

  let deptMap = {};
  try {
    const raw = localStorage.getItem("SOLAR_DEPT_SALARY_TEMPLATES");
    if (raw) deptMap = JSON.parse(raw);
  } catch (e) {}

  // 1. Check custom employee match
  const candidateKeys = [
    emp.empId,
    emp.id,
    emp._id,
    emp.name,
    String(emp.name || "").trim().toLowerCase(),
    String(emp.empId || "").trim().toLowerCase(),
  ].filter(Boolean);

  for (const k of candidateKeys) {
    if (customMap[k] && (customMap[k].earnings?.length > 0 || customMap[k].deductions?.length > 0)) {
      return customMap[k];
    }
  }

  // 2. Check department or role template match
  const dept = String(emp.department || "").trim();
  const role = String(emp.role || emp.designation || "").trim();
  const roleLower = role.toLowerCase();
  const deptLower = dept.toLowerCase();

  // Direct dept / role lookup
  if (deptMap[dept] && (deptMap[dept].earnings?.length > 0 || deptMap[dept].deductions?.length > 0)) {
    return deptMap[dept];
  }
  if (deptMap[role] && (deptMap[role].earnings?.length > 0 || deptMap[role].deductions?.length > 0)) {
    return deptMap[role];
  }

  // Normalized company role
  let normalizedDept = "Incharge";
  if (roleLower.includes("manager") || roleLower.includes("admin") || roleLower.includes("operation_lead") || roleLower.includes("project_head") || deptLower.includes("manager")) {
    normalizedDept = "Manager";
  } else if (roleLower.includes("supervisor") || deptLower.includes("supervisor")) {
    normalizedDept = "Supervisor";
  } else {
    // Incharge, ZSM, TEAM, Installer
    normalizedDept = "Incharge";
  }

  if (deptMap[normalizedDept] && (deptMap[normalizedDept].earnings?.length > 0 || deptMap[normalizedDept].deductions?.length > 0)) {
    return deptMap[normalizedDept];
  }

  return null;
}

// Helper to compute breakdown for an employee based on role, month, and attendance
export function calculateEmployeePayroll(emp, monthStr = "August 2026") {
  const periodInfo = getMonthPeriodDetails(monthStr);
  const totalDays = periodInfo.totalDays;

  // Real Attendance details
  const rawAtt = emp.attendance || {};
  const absentDays = rawAtt.absentDays !== undefined ? rawAtt.absentDays : (emp.name?.includes("incharge demo") ? 1 : 0);
  const presentDays = rawAtt.presentDays !== undefined ? rawAtt.presentDays : Math.max(0, totalDays - absentDays);
  const leavePaid = rawAtt.leavePaid || 0;
  const leaveUnpaid = rawAtt.leaveUnpaid || 0;
  const holidays = rawAtt.holidays || 0;

  const att = {
    totalDays,
    presentDays,
    absentDays,
    leavePaid,
    leaveUnpaid,
    holidays,
  };

  // Case A: Manually adjusted on Payroll page (customBasic, etc.)
  if (emp.customBasic !== undefined || emp.isAdjusted) {
    const basic = Number(emp.customBasic) || 0;
    const hra = Number(emp.customHra) || 0;
    const special = Number(emp.customSpecial) || 0;
    const other = Number(emp.customOther) || 0;
    const bonus = Number(emp.customBonus) || 0;
    const pf = Number(emp.customPf) || 0;
    const pt = Number(emp.customPt) || 0;
    const tds = Number(emp.customTds) || 0;
    const otherDeduction = Number(emp.customOtherDeduction) || 0;

    const gross = basic + hra + special + other + bonus;
    const perDaySalary = gross / totalDays;
    const lopAmount = absentDays > 0 ? Math.round(perDaySalary * absentDays * 100) / 100 : 0;
    const totalDeductions = pf + pt + tds + otherDeduction + lopAmount;
    const netPay = Math.max(0, Math.round((gross - totalDeductions) * 100) / 100);

    return {
      basic,
      hra,
      special,
      otherAllowance: other,
      gross,
      pf,
      pt,
      tds,
      lopDays: absentDays,
      lopAmount,
      deductions: totalDeductions,
      netPay,
      earnings: [
        { component: "Basic Salary", amount: basic },
        { component: "House Rent Allowance (HRA)", amount: hra },
        ...(special > 0 ? [{ component: "Special Allowance", amount: special }] : []),
        ...(other > 0 ? [{ component: "Other Allowance", amount: other }] : []),
        ...(bonus > 0 ? [{ component: "Bonus / Incentive", amount: bonus }] : []),
      ],
      deductionsBreakdown: [
        { component: "Provident Fund (PF)", amount: pf },
        { component: "Professional Tax (PT)", amount: pt },
        { component: "TDS (Income Tax)", amount: tds },
        ...(otherDeduction > 0 ? [{ component: "Other Deductions", amount: otherDeduction }] : []),
        ...(absentDays > 0 ? [{ component: `Loss of Pay (LOP) - ${absentDays} Day${absentDays > 1 ? "s" : ""}`, amount: lopAmount }] : []),
      ],
      attendance: att,
      payPeriod: periodInfo.payPeriod,
      generatedDate: periodInfo.defaultGeneratedDate,
    };
  }

  // Case B: Saved salary structure from Salary Settings (Salaries page)
  const savedStruct = getSavedSalaryStructure(emp);
  if (savedStruct && (savedStruct.earnings?.length > 0 || savedStruct.deductions?.length > 0)) {
    const rawEarnings = savedStruct.earnings || [];
    const rawDeductions = savedStruct.deductions || [];

    const earnings = rawEarnings.map((item) => ({
      component: item.component || item.name || "Allowance",
      amount: Number(item.amount) || 0,
    }));

    const gross = earnings.reduce((acc, curr) => acc + curr.amount, 0);

    const basicItem = earnings.find((e) => (e.component || "").toLowerCase().includes("basic"));
    const basic = basicItem ? basicItem.amount : (gross > 0 ? Math.round(gross * 0.5) : 0);

    const hraItem = earnings.find((e) => (e.component || "").toLowerCase().includes("hra") || (e.component || "").toLowerCase().includes("rent"));
    const hra = hraItem ? hraItem.amount : 0;

    const specialItem = earnings.find((e) => (e.component || "").toLowerCase().includes("special") || (e.component || "").toLowerCase().includes("field"));
    const special = specialItem ? specialItem.amount : 0;

    const otherAllowance = Math.max(0, gross - basic - hra - special);

    const deductionsBreakdown = rawDeductions.map((item) => ({
      component: item.component || item.name || "Deduction",
      amount: Number(item.amount) || 0,
    }));

    const totalFixedDeductions = deductionsBreakdown.reduce((acc, curr) => acc + curr.amount, 0);

    const pfItem = deductionsBreakdown.find((d) => (d.component || "").toLowerCase().includes("pf") || (d.component || "").toLowerCase().includes("provident"));
    const pf = pfItem ? pfItem.amount : 0;

    const ptItem = deductionsBreakdown.find((d) => (d.component || "").toLowerCase().includes("pt") || (d.component || "").toLowerCase().includes("professional"));
    const pt = ptItem ? ptItem.amount : 0;

    const tdsItem = deductionsBreakdown.find((d) => (d.component || "").toLowerCase().includes("tds") || (d.component || "").toLowerCase().includes("tax"));
    const tds = tdsItem ? tdsItem.amount : 0;

    const perDaySalary = gross / totalDays;
    const lopAmount = absentDays > 0 ? Math.round(perDaySalary * absentDays * 100) / 100 : 0;

    if (absentDays > 0 && lopAmount > 0) {
      deductionsBreakdown.push({
        component: `Loss of Pay (LOP) - ${absentDays} Day${absentDays > 1 ? "s" : ""}`,
        amount: lopAmount,
      });
    }

    const totalDeductions = totalFixedDeductions + lopAmount;
    const netPay = Math.max(0, Math.round((gross - totalDeductions) * 100) / 100);

    return {
      basic,
      hra,
      special,
      otherAllowance,
      gross,
      pf,
      pt,
      tds,
      lopDays: absentDays,
      lopAmount,
      deductions: totalDeductions,
      netPay,
      earnings,
      deductionsBreakdown,
      attendance: att,
      payPeriod: periodInfo.payPeriod,
      generatedDate: periodInfo.defaultGeneratedDate,
    };
  }

  // Case C: Standard initial defaults
  const dept = emp.department || "Incharge";
  const roleLower = String(emp.role || emp.designation || "").toLowerCase();
  let basic = 10000;
  let hra = 2000;
  let special = 0;
  let other = 0;
  let pf = 0;
  let pt = 0;
  let tds = 0;

  if (dept === "Manager" || roleLower.includes("manager") || emp.name?.includes("360 Connect")) {
    basic = 35000;
    hra = 14000;
    special = 8000;
    other = 4000;
    pf = 4200;
    pt = 200;
    tds = 2500;
  } else if (dept === "Supervisor" || roleLower.includes("supervisor")) {
    basic = 26000;
    hra = 10400;
    special = 4000;
    other = 2000;
    pf = 3120;
    pt = 200;
    tds = 1200;
  } else {
    // Incharge / ZSM / Rahul Roy default: Basic 10,000 + HRA 2,000 = 12,000 Gross / Net
    basic = 10000;
    hra = 2000;
    special = 0;
    other = 0;
    pf = 0;
    pt = 0;
    tds = 0;
  }

  const gross = basic + hra + special + other;
  const perDaySalary = gross / totalDays;
  const lopAmount = absentDays > 0 ? Math.round(perDaySalary * absentDays * 100) / 100 : 0;
  const totalDeductions = pf + pt + tds + lopAmount;
  const netPay = Math.max(0, Math.round((gross - totalDeductions) * 100) / 100);

  const earnings = [
    { component: "Basic Salary", amount: basic },
    { component: "House Rent Allowance (HRA)", amount: hra },
    ...(special > 0 ? [{ component: "Special Allowance", amount: special }] : []),
    ...(other > 0 ? [{ component: "Other Allowance", amount: other }] : []),
  ];

  const deductions = [
    ...(pf > 0 ? [{ component: "Provident Fund (PF)", amount: pf }] : []),
    ...(pt > 0 ? [{ component: "Professional Tax (PT)", amount: pt }] : []),
    ...(tds > 0 ? [{ component: "TDS (Income Tax)", amount: tds }] : []),
    ...(absentDays > 0 ? [{ component: `Loss of Pay (LOP) - ${absentDays} Day${absentDays > 1 ? "s" : ""}`, amount: lopAmount }] : []),
  ];

  return {
    basic,
    hra,
    special,
    otherAllowance: other,
    gross,
    pf,
    pt,
    tds,
    lopDays: absentDays,
    lopAmount,
    deductions: totalDeductions,
    netPay,
    earnings,
    deductionsBreakdown: deductions,
    attendance: att,
    payPeriod: periodInfo.payPeriod,
    generatedDate: periodInfo.defaultGeneratedDate,
  };
}

// ─── Storage Key Builders ─────────────────────────────────────────────────────
const getStorageKey = (month) => `SOLAR_PAYROLL_STATE_${String(month || "August 2026").replace(/\s+/g, "_")}`;

// Get monthly payroll state
export function getMonthlyPayrollState(month = "August 2026", availableUsers = []) {
  const key = getStorageKey(month);
  const periodInfo = getMonthPeriodDetails(month);
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.status && Array.isArray(parsed.employees)) {
        let employees = parsed.employees;

        // If real backend users are passed, merge all users into the payroll state
        if (availableUsers && availableUsers.length > 0) {
          const existingMap = new Map();
          employees.forEach((e) => {
            const k = String(e.id || e._id || e.empId || e.name).trim().toLowerCase();
            existingMap.set(k, e);
          });

          // Keep payment & finalized status of existing users, and include any new 3rd/subsequent users
          const mergedList = availableUsers.map((u) => {
            const k = String(u.id || u._id || u.empId || u.name).trim().toLowerCase();
            const existing = existingMap.get(k);
            if (existing) {
              return {
                ...u,
                ...existing,
                name: u.name || existing.name,
                empId: u.empId || existing.empId,
                department: u.department || existing.department,
                designation: u.designation || existing.designation,
              };
            }
            // New user added to system
            return {
              ...u,
              status: parsed.status === PAYROLL_STATUS.FINALIZED ? EMPLOYEE_PAYROLL_STATUS.FINALIZED : (parsed.status === PAYROLL_STATUS.READY ? EMPLOYEE_PAYROLL_STATUS.READY : EMPLOYEE_PAYROLL_STATUS.PENDING),
              paymentStatus: PAYMENT_STATUS.PENDING,
              slipStatus: parsed.status === PAYROLL_STATUS.FINALIZED ? SLIP_STATUS.GENERATED : SLIP_STATUS.NOT_GENERATED,
            };
          });

          employees = mergedList;
          parsed.employees = employees;
          saveMonthlyPayrollState(month, parsed);
        }

        parsed.employees = employees.map((emp) => {
          const recalculated = calculateEmployeePayroll(emp, month);
          return {
            ...emp,
            ...recalculated,
            month,
            payPeriod: periodInfo.payPeriod,
            status: emp.status || EMPLOYEE_PAYROLL_STATUS.PENDING,
            paymentStatus: emp.paymentStatus || PAYMENT_STATUS.PENDING,
            slipStatus: emp.slipStatus || (parsed.status === PAYROLL_STATUS.FINALIZED ? SLIP_STATUS.GENERATED : SLIP_STATUS.NOT_GENERATED),
          };
        });
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading payroll state:", e);
  }

  // Generate initial un-processed state
  const baseList = availableUsers.length > 0 ? availableUsers : DEFAULT_HRMS_ROSTER;
  const initialEmployees = baseList.map((emp) => {
    const calculated = calculateEmployeePayroll(emp, month);
    return {
      ...emp,
      ...calculated,
      month: month || "August 2026",
      payPeriod: periodInfo.payPeriod,
      status: EMPLOYEE_PAYROLL_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      slipStatus: SLIP_STATUS.NOT_GENERATED,
    };
  });

  const initialState = {
    month: month || "August 2026",
    status: PAYROLL_STATUS.NOT_PROCESSED,
    processedAt: null,
    finalizedAt: null,
    employees: initialEmployees,
  };

  return initialState;
}

// Save monthly payroll state
export function saveMonthlyPayrollState(month, state) {
  const key = getStorageKey(month);
  try {
    localStorage.setItem(key, JSON.stringify(state));
    // Trigger cross-tab/page storage event
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Error saving payroll state:", e);
  }
}

// Action: Process Payroll (PENDING -> READY)
export function processMonthlyPayrollAction(month, currentEmployees) {
  const updatedEmployees = currentEmployees.map((emp) => {
    const calculated = calculateEmployeePayroll(emp, month);
    return {
      ...emp,
      ...calculated,
      month: month || "August 2026",
      status: EMPLOYEE_PAYROLL_STATUS.READY,
      paymentStatus: emp.paymentStatus || PAYMENT_STATUS.PENDING,
      slipStatus: SLIP_STATUS.NOT_GENERATED,
    };
  });

  const state = {
    month: month || "August 2026",
    status: PAYROLL_STATUS.READY,
    processedAt: new Date().toISOString(),
    finalizedAt: null,
    employees: updatedEmployees,
  };

  saveMonthlyPayrollState(month, state);
  return state;
}

// Action: Finalize Payroll (READY -> FINALIZED) + Generates Salary Slips
export function finalizeMonthlyPayrollAction(month, currentEmployees) {
  const updatedEmployees = currentEmployees.map((emp) => {
    const calculated = calculateEmployeePayroll(emp, month);
    return {
      ...emp,
      ...calculated,
      status: EMPLOYEE_PAYROLL_STATUS.FINALIZED,
      slipStatus: SLIP_STATUS.GENERATED,
      month: month || "August 2026",
    };
  });

  const state = {
    month: month || "August 2026",
    status: PAYROLL_STATUS.FINALIZED,
    processedAt: new Date().toISOString(),
    finalizedAt: new Date().toISOString(),
    employees: updatedEmployees,
  };

  saveMonthlyPayrollState(month, state);
  return state;
}

// Action: Mark Individual or All Employees as Paid
export function updateEmployeePaymentAction(month, employeeId, paymentStatus) {
  const state = getMonthlyPayrollState(month);
  const updatedEmployees = state.employees.map((emp) => {
    if (employeeId === "ALL" || emp.id === employeeId || emp.empId === employeeId) {
      return { ...emp, paymentStatus };
    }
    return emp;
  });

  state.employees = updatedEmployees;
  saveMonthlyPayrollState(month, state);
  return state;
}

// Check if Payroll can be safely reopened based on payment status
export function canReopenPayroll(month) {
  const state = getMonthlyPayrollState(month);
  const employees = state.employees || [];
  const paidCount = employees.filter((e) => e.paymentStatus === PAYMENT_STATUS.PAID).length;
  const totalCount = employees.length;

  if (state.status !== PAYROLL_STATUS.FINALIZED) {
    return { canReopen: false, reason: "NOT_FINALIZED", paidCount, totalCount };
  }

  if (paidCount === 0) {
    return { canReopen: true, paidCount, totalCount };
  }

  if (paidCount === totalCount && totalCount > 0) {
    return { canReopen: false, reason: "ALL_PAID", paidCount, totalCount };
  }

  return { canReopen: false, reason: "SOME_PAID", paidCount, totalCount };
}

// Action: Reset Payroll back to NOT_PROCESSED (Pending)
export function resetMonthlyPayrollAction(month) {
  const state = getMonthlyPayrollState(month);
  const updatedEmployees = state.employees.map((emp) => {
    const calculated = calculateEmployeePayroll(emp, month);
    return {
      ...emp,
      ...calculated,
      status: EMPLOYEE_PAYROLL_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING,
      slipStatus: SLIP_STATUS.NOT_GENERATED,
    };
  });

  const resetState = {
    month: month || "August 2026",
    status: PAYROLL_STATUS.NOT_PROCESSED,
    processedAt: null,
    finalizedAt: null,
    employees: updatedEmployees,
  };

  saveMonthlyPayrollState(month, resetState);
  return resetState;
}

// Action: Reopen Payroll (FINALIZED -> READY, Slip Status -> NEEDS_REGENERATION)
export function reopenMonthlyPayrollAction(month, options = {}) {
  const { force = true } = options;
  const check = canReopenPayroll(month);
  if (!check.canReopen && !force) {
    return { success: false, reason: check.reason, paidCount: check.paidCount, totalCount: check.totalCount };
  }

  const state = getMonthlyPayrollState(month);
  const updatedEmployees = state.employees.map((emp) => {
    const calculated = calculateEmployeePayroll(emp, month);
    return {
      ...emp,
      ...calculated,
      status: EMPLOYEE_PAYROLL_STATUS.READY,
      paymentStatus: PAYMENT_STATUS.PENDING,
      slipStatus: SLIP_STATUS.NEEDS_REGENERATION,
    };
  });

  state.status = PAYROLL_STATUS.READY;
  state.finalizedAt = null;
  state.employees = updatedEmployees;

  saveMonthlyPayrollState(month, state);
  return { success: true, state };
}

// Action: Adjust individual unpaid employee payroll without affecting paid employees
export function adjustIndividualEmployeePayrollAction(month, employeeId, adjustmentData) {
  const state = getMonthlyPayrollState(month);
  const updatedEmployees = state.employees.map((emp) => {
    if (emp.id === employeeId || emp.empId === employeeId) {
      const updatedEmp = {
        ...emp,
        ...adjustmentData,
        attendance: {
          ...emp.attendance,
          ...(adjustmentData.attendance || {}),
        },
        hasAdjustment: true,
        adjustmentNotes: adjustmentData.adjustmentNotes || "",
        adjustedAt: new Date().toISOString(),
        // If payroll is finalized, maintain GENERATED status with corrected data
        slipStatus: SLIP_STATUS.GENERATED,
      };
      const calculated = calculateEmployeePayroll(updatedEmp, month);
      return {
        ...updatedEmp,
        ...calculated,
      };
    }
    return emp;
  });

  state.employees = updatedEmployees;
  saveMonthlyPayrollState(month, state);
  return state;
}

// Get All Salary Slips for Salary Slips Page
export function getMonthlySalarySlips(month) {
  const state = getMonthlyPayrollState(month);
  return {
    payrollStatus: state.status,
    month: state.month,
    finalized: state.status === PAYROLL_STATUS.FINALIZED,
    slips: state.employees.map((emp) => {
      const calculated = calculateEmployeePayroll(emp, state.month);
      return {
        ...emp,
        ...calculated,
        month: state.month,
        status: emp.slipStatus || (state.status === PAYROLL_STATUS.FINALIZED ? SLIP_STATUS.GENERATED : SLIP_STATUS.NOT_GENERATED),
      };
    }),
  };
}

