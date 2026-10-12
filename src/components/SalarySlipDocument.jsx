import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { Close, Print, Download } from "@mui/icons-material";

// Global Print Styles to print only the payslip document on A4
const PrintStyleTag = () => (
  <style>{`
    @media print {
      body * {
        visibility: hidden !important;
      }
      .salary-slip-printable, .salary-slip-printable * {
        visibility: visible !important;
      }
      .salary-slip-printable {
        position: fixed !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 20px !important;
        box-shadow: none !important;
        border: none !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
    }
  `}</style>
);

// Helper: Convert Number to Indian Rupees Words
export function numberToWordsIndian(num) {
  if (num === null || num === undefined || isNaN(num)) return "Rupees Zero Only";
  const intPart = Math.floor(Math.abs(num));
  const decPart = Math.round((Math.abs(num) - intPart) * 100);

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertHundreds(n) {
    let str = "";
    if (n > 99) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + " ";
    }
    return str.trim();
  }

  if (intPart === 0) return "Rupees Zero Only";

  let words = "";
  const crore = Math.floor(intPart / 10000000);
  let rem = intPart % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  const hundreds = rem;

  if (crore > 0) words += convertHundreds(crore) + " Crore ";
  if (lakh > 0) words += convertHundreds(lakh) + " Lakh ";
  if (thousand > 0) words += convertHundreds(thousand) + " Thousand ";
  if (hundreds > 0) words += convertHundreds(hundreds) + " ";

  let res = `Rupees ${words.trim()}`;
  if (decPart > 0) {
    res += ` and ${convertHundreds(decPart)} Paise`;
  }
  return `${res} Only`;
}

// Logo SVG component matching the Vanurtech Solar emblem
function SolarLogo({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sun rays & orb */}
      <circle cx="50" cy="22" r="14" fill="#F59E0B" />
      <path d="M50 2 L50 6" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <path d="M33 7 L36 10" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <path d="M67 7 L64 10" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <path d="M22 18 L26 19" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <path d="M78 18 L74 19" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />

      {/* Trapezoidal solar panel */}
      <path d="M12 42 L88 42 L74 92 L26 92 Z" fill="#2563EB" />
      <path d="M14 44 L86 44 L73 90 L27 90 Z" fill="#1D4ED8" />

      {/* Solar panel grid lines */}
      <line x1="50" y1="44" x2="50" y2="90" stroke="#93C5FD" strokeWidth="2.5" />
      <line x1="31" y1="44" x2="38" y2="90" stroke="#93C5FD" strokeWidth="2" />
      <line x1="69" y1="44" x2="62" y2="90" stroke="#93C5FD" strokeWidth="2" />
      <line x1="20" y1="58" x2="80" y2="58" stroke="#93C5FD" strokeWidth="2" />
      <line x1="24" y1="74" x2="76" y2="74" stroke="#93C5FD" strokeWidth="2" />

      {/* Stylized V wing overlay */}
      <path d="M4 36 L24 94 L36 94 L22 36 Z" fill="#60A5FA" opacity="0.9" />
    </svg>
  );
}

// Helper: Calculate exact Month Period starting from day 1 (e.g. 1 Aug 2026 - 31 Aug 2026)
export function getMonthPeriodDetails(monthStr) {
  const parts = String(monthStr || "August 2026").trim().split(" ");
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
    payPeriod: `1 ${shortMonth} ${year} - ${lastDay} ${shortMonth} ${year}`,
    defaultGeneratedDate: `05 ${nextMonthName} ${nextMonthYear}`,
  };
}

// ─── MAIN SALARY SLIP VIEW COMPONENT ──────────────────────────────────────────
export const SalarySlipView = React.forwardRef(function SalarySlipView({ slipData = {} }, ref) {
  const monthStr = slipData.month || "August 2026";
  const periodInfo = getMonthPeriodDetails(monthStr);

  const empName = slipData.name || slipData.employeeName || "incharge demo";
  const empId = slipData.empId || slipData.employeeId || "I0015";
  const designation = slipData.designation || slipData.role || "Technical Incharge";
  const department = slipData.department || "Technical";
  const employmentType = slipData.employmentType || "Full-time";
  const joiningDate = slipData.joiningDate || slipData.dateOfJoining || "6 Aug 2026";
  const payPeriod = slipData.payPeriod || periodInfo.payPeriod;
  const rawBank = slipData.bankName || slipData.bank || "State Bank of India";
  const bankName = rawBank.includes("(") ? rawBank.split("(")[0].trim() : rawBank;
  const accountNo = slipData.accountNo || slipData.accountNumber || (rawBank.includes("••••") ? `XXXX XXXX ${rawBank.split("••••")[1].replace(")", "").trim()}` : "XXXX XXXX 7890");
  const ifscCode = slipData.ifscCode || slipData.ifsc || "SBIN0001234";
  const pan = slipData.pan || slipData.panNumber || "ABCPD1234F";
  const generatedDate = slipData.generatedDate || slipData.date || periodInfo.defaultGeneratedDate;

  // Real Attendance details starting from 1st of month
  const rawAtt = slipData.attendance || {};
  const totalDays = rawAtt.totalDays || slipData.totalDays || periodInfo.totalDays;
  const absentDays = rawAtt.absentDays !== undefined ? rawAtt.absentDays : (slipData.absentDays !== undefined ? slipData.absentDays : 1);
  const presentDays = rawAtt.presentDays !== undefined ? rawAtt.presentDays : (slipData.presentDays !== undefined ? slipData.presentDays : Math.max(0, totalDays - absentDays));
  const leavePaid = rawAtt.leavePaid || slipData.leavePaid || 0;
  const leaveUnpaid = rawAtt.leaveUnpaid || slipData.leaveUnpaid || 0;
  const holidays = rawAtt.holidays || slipData.holidays || 0;

  const attendance = {
    totalDays,
    presentDays,
    absentDays,
    leavePaid,
    leaveUnpaid,
    holidays,
  };

  // Real Earnings Items
  let earningsList = [];
  if (Array.isArray(slipData.earnings) && slipData.earnings.length > 0) {
    earningsList = slipData.earnings.map((e) => ({
      component: e.component || e.name || "Earning",
      amount: Number(e.amount) || 0,
    }));
  } else if (Array.isArray(slipData.allowanceDetails) && slipData.allowanceDetails.length > 0) {
    const basicVal = Number(slipData.basicSalary || slipData.basic || 0);
    earningsList = [
      ...(basicVal > 0 ? [{ component: "Basic Salary", amount: basicVal }] : []),
      ...slipData.allowanceDetails.map((a) => ({
        component: a.name || a.component || "Allowance",
        amount: Number(a.amount) || 0,
      })),
    ];
  } else {
    earningsList = [
      { component: "Basic Salary", amount: Number(String(slipData.basic || slipData.basicSalary || 25000).replace(/,/g, "")) || 25000 },
      { component: "House Rent Allowance (HRA)", amount: Number(String(slipData.hra || 10000).replace(/,/g, "")) || 10000 },
      { component: "Special Allowance", amount: Number(String(slipData.allowances || slipData.special || 5000).replace(/,/g, "")) || 5000 },
      { component: "Other Allowance", amount: Number(String(slipData.otherAllowance || 2000).replace(/,/g, "")) || 2000 },
    ];
  }

  // Ensure Basic Salary is present if specified
  if (slipData.basicSalary && !earningsList.some((e) => e.component.toLowerCase().includes("basic"))) {
    earningsList.unshift({ component: "Basic Salary", amount: Number(slipData.basicSalary) || 0 });
  }

  const totalEarnings = earningsList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Deductions Items
  const lopAmount = (slipData.lopAmount !== undefined) 
    ? slipData.lopAmount 
    : (attendance.absentDays > 0 ? Number(((totalEarnings / (attendance.totalDays || 31)) * attendance.absentDays).toFixed(2)) : 0);

  let deductionsList = [];
  if (Array.isArray(slipData.deductions) && slipData.deductions.length > 0) {
    deductionsList = slipData.deductions.map((d) => ({
      component: d.component || d.name || "Deduction",
      amount: Number(d.amount) || 0,
    }));
  } else if (Array.isArray(slipData.deductionDetails) && slipData.deductionDetails.length > 0) {
    deductionsList = slipData.deductionDetails.map((d) => ({
      component: d.name || d.component || "Deduction",
      amount: Number(d.amount) || 0,
    }));
  } else {
    deductionsList = [
      { component: "Provident Fund (PF)", amount: Number(String(slipData.pf || 1800).replace(/,/g, "")) || 1800 },
      { component: "Professional Tax (PT)", amount: Number(String(slipData.pt || 200).replace(/,/g, "")) || 200 },
      { component: "TDS (Income Tax)", amount: Number(String(slipData.tds || 1000).replace(/,/g, "")) || 1000 },
      ...(attendance.absentDays > 0 ? [{ component: `Loss of Pay (LOP) - ${attendance.absentDays} Day`, amount: lopAmount || 1354.84 }] : []),
    ];
  }

  const totalDeductions = deductionsList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const netPayable = Math.max(0, totalEarnings - totalDeductions);
  const amountInWords = slipData.amountInWords || numberToWordsIndian(netPayable);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Box
      ref={ref}
      className="salary-slip-printable"
      sx={{
        width: "100%",
        maxWidth: "850px",
        mx: "auto",
        bgcolor: "#ffffff",
        color: "#0f172a",
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
        p: { xs: 2, sm: 3.5 },
        borderRadius: "12px",
        boxShadow: "0 4px 25px rgba(0,0,0,0.06)",
        border: "1px solid #e2e8f0",
        "@media print": {
          boxShadow: "none",
          border: "none",
          p: 2,
          maxWidth: "100%",
          width: "100%",
        },
      }}
    >
      {/* ── 1. HEADER SECTION ───────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 2,
          borderBottom: "2px solid #1e3a8a",
        }}
      >
        {/* Left: Logo & Company Name */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <SolarLogo size={56} />
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: "#0f2347",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                fontSize: { xs: "1.25rem", sm: "1.55rem" },
              }}
            >
              Vanurtech Pvt Ltd
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "#1d4ed8",
                fontSize: "0.85rem",
                mt: 0.2,
              }}
            >
              Solar Technical & Installation Services
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "#64748b",
                fontSize: "0.74rem",
                display: "block",
                mt: 0.3,
                fontWeight: 500,
              }}
            >
              Clean Energy &nbsp;|&nbsp; Reliable Service &nbsp;|&nbsp; Brighter Tomorrow
            </Typography>
          </Box>
        </Box>

        {/* Middle: Slogan */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 2,
            pr: 2,
            borderRight: "1px solid #cbd5e1",
          }}
        >
          <Typography
            sx={{
              color: "#64748b",
              fontSize: "0.78rem",
              lineHeight: 1.3,
              fontWeight: 500,
              textAlign: "left",
            }}
          >
            Powering<br />
            a Sustainable<br />
            Tomorrow
          </Typography>
        </Box>

        {/* Right: Salary Slip Badge */}
        <Box
          sx={{
            bgcolor: "#e8f2fe",
            px: { xs: 2, sm: 3 },
            py: 1.2,
            borderRadius: "8px",
            textAlign: "center",
            minWidth: { xs: "120px", sm: "160px" },
          }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              color: "#0f2347",
              fontSize: { xs: "1.1rem", sm: "1.3rem" },
              lineHeight: 1.2,
            }}
          >
            Salary Slip
          </Typography>
          <Typography
            sx={{
              fontWeight: 700,
              color: "#1e3a8a",
              fontSize: { xs: "0.82rem", sm: "0.95rem" },
              mt: 0.3,
            }}
          >
            {monthStr}
          </Typography>
        </Box>
      </Box>

      {/* ── 2. EMPLOYEE DETAILS SECTION ─────────────────────────────── */}
      <Box sx={{ mt: 2.2 }}>
        {/* Header Bar */}
        <Box
          sx={{
            bgcolor: "#e8f0fe",
            py: 0.7,
            px: 1.8,
            borderRadius: "6px 6px 0 0",
            border: "1px solid #bfdbfe",
            borderBottom: "none",
          }}
        >
          <Typography sx={{ fontWeight: 800, color: "#1e3a8a", fontSize: "0.92rem" }}>
            Employee Details
          </Typography>
        </Box>

        {/* Content Box */}
        <Box
          sx={{
            border: "1px solid #bfdbfe",
            borderRadius: "0 0 6px 6px",
            p: 1.5,
            bgcolor: "#ffffff",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: { xs: 1, sm: 2 },
            }}
          >
            {/* Left Column */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
              <DetailRow label="Employee Name" value={empName} isBold />
              <DetailRow label="Employee ID" value={empId} />
              <DetailRow label="Designation" value={designation} />
              <DetailRow label="Department" value={department} />
              <DetailRow label="Employment Type" value={employmentType} />
            </Box>

            {/* Right Column */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.6,
                pl: { sm: 2 },
                borderLeft: { sm: "1px solid #e2e8f0" },
              }}
            >
              <DetailRow label="Date of Joining" value={joiningDate} />
              <DetailRow label="Pay Period" value={payPeriod} />
              <DetailRow label="Bank Name" value={bankName} />
              <DetailRow label="Account No." value={accountNo} />
              <DetailRow label="IFSC Code" value={ifscCode} />
              <DetailRow label="PAN" value={pan} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── 3. ATTENDANCE SUMMARY SECTION ───────────────────────────── */}
      <Box sx={{ mt: 2 }}>
        {/* Header Bar */}
        <Box
          sx={{
            bgcolor: "#e8f0fe",
            py: 0.7,
            px: 1.8,
            borderRadius: "6px 6px 0 0",
            border: "1px solid #bfdbfe",
            borderBottom: "none",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: "0.95rem" }}>📅</Typography>
          <Typography sx={{ fontWeight: 800, color: "#1e3a8a", fontSize: "0.92rem" }}>
            Attendance Summary
          </Typography>
        </Box>

        {/* Attendance Grid Table */}
        <Box
          sx={{
            border: "1px solid #bfdbfe",
            borderRadius: "0 0 6px 6px",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            textAlign: "center",
          }}
        >
          {/* Header Row */}
          {[
            "Total Days",
            "Present Days",
            "Absent (LOP)",
            "Leave (Paid)",
            "Leave (Unpaid)",
            "Holidays / Weekly Off",
          ].map((title, idx) => (
            <Box
              key={idx}
              sx={{
                bgcolor: "#f0f6ff",
                py: 0.8,
                px: 0.5,
                borderRight: idx < 5 ? "1px solid #cbd5e1" : "none",
                borderBottom: "1px solid #cbd5e1",
              }}
            >
              <Typography sx={{ fontSize: "0.73rem", fontWeight: 700, color: "#1e3a8a" }}>
                {title}
              </Typography>
            </Box>
          ))}

          {/* Value Row */}
          {[
            attendance.totalDays,
            attendance.presentDays,
            attendance.absentDays,
            attendance.leavePaid,
            attendance.leaveUnpaid,
            attendance.holidays,
          ].map((val, idx) => (
            <Box
              key={idx}
              sx={{
                py: 0.8,
                px: 0.5,
                borderRight: idx < 5 ? "1px solid #cbd5e1" : "none",
                bgcolor: "#ffffff",
              }}
            >
              <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                {val}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── 4. EARNINGS & DEDUCTIONS SIDE-BY-SIDE ────────────────────── */}
      <Box
        sx={{
          mt: 2,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        {/* Earnings Card */}
        <Box
          sx={{
            border: "1px solid #86efac",
            borderRadius: "6px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Title Header */}
          <Box
            sx={{
              bgcolor: "#dcfce7",
              py: 0.7,
              px: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                bgcolor: "#16a34a",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                fontWeight: 900,
              }}
            >
              ₹
            </Box>
            <Typography sx={{ fontWeight: 800, color: "#15803d", fontSize: "0.92rem" }}>
              Earnings
            </Typography>
          </Box>

          {/* Column Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              bgcolor: "#f0fdf4",
              py: 0.5,
              px: 1.5,
              borderTop: "1px solid #bbf7d0",
              borderBottom: "1px solid #bbf7d0",
            }}
          >
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a" }}>
              Component
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a" }}>
              Amount (₹)
            </Typography>
          </Box>

          {/* Rows */}
          <Box sx={{ flexGrow: 1, bgcolor: "#ffffff" }}>
            {earningsList.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  py: 0.5,
                  px: 1.5,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <Typography sx={{ fontSize: "0.78rem", color: "#334155" }}>
                  {item.component}
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#0f172a" }}>
                  {formatCurrency(item.amount)}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Footer Total */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              bgcolor: "#dcfce7",
              py: 0.8,
              px: 1.5,
              borderTop: "1px solid #86efac",
            }}
          >
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "#15803d" }}>
              Total Earnings (A)
            </Typography>
            <Typography sx={{ fontSize: "0.92rem", fontWeight: 900, color: "#0f172a" }}>
              {formatCurrency(totalEarnings)}
            </Typography>
          </Box>
        </Box>

        {/* Deductions Card */}
        <Box
          sx={{
            border: "1px solid #fca5a5",
            borderRadius: "6px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Title Header */}
          <Box
            sx={{
              bgcolor: "#fee2e2",
              py: 0.7,
              px: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                bgcolor: "#dc2626",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              −
            </Box>
            <Typography sx={{ fontWeight: 800, color: "#b91c1c", fontSize: "0.92rem" }}>
              Deductions
            </Typography>
          </Box>

          {/* Column Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              bgcolor: "#fff1f2",
              py: 0.5,
              px: 1.5,
              borderTop: "1px solid #fecaca",
              borderBottom: "1px solid #fecaca",
            }}
          >
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a" }}>
              Component
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a" }}>
              Amount (₹)
            </Typography>
          </Box>

          {/* Rows */}
          <Box sx={{ flexGrow: 1, bgcolor: "#ffffff" }}>
            {deductionsList.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  py: 0.5,
                  px: 1.5,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <Typography sx={{ fontSize: "0.78rem", color: "#334155" }}>
                  {item.component}
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#0f172a" }}>
                  {formatCurrency(item.amount)}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Footer Total */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              bgcolor: "#fee2e2",
              py: 0.8,
              px: 1.5,
              borderTop: "1px solid #fca5a5",
            }}
          >
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "#b91c1c" }}>
              Total Deductions (B)
            </Typography>
            <Typography sx={{ fontSize: "0.92rem", fontWeight: 900, color: "#b91c1c" }}>
              {formatCurrency(totalDeductions)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── 5. NET PAYABLE (A - B) BANNER ────────────────────────────── */}
      <Box
        sx={{
          mt: 2,
          border: "1px solid #bfdbfe",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        {/* Main Net Amount Row */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            bgcolor: "#e8f0fe",
          }}
        >
          {/* Left label & icon */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, p: 1.2, pl: 2 }}>
            <Box
              sx={{
                bgcolor: "#1d4ed8",
                color: "#ffffff",
                p: 0.6,
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
              }}
            >
              🧮
            </Box>
            <Typography sx={{ fontWeight: 800, color: "#1e3a8a", fontSize: "1rem" }}>
              Net Payable (A - B)
            </Typography>
          </Box>

          {/* Right Amount Pill */}
          <Box
            sx={{
              bgcolor: "#1d68f0",
              color: "#ffffff",
              px: { xs: 2.5, sm: 4 },
              py: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: { xs: "1.15rem", sm: "1.35rem" },
                letterSpacing: "0.02em",
              }}
            >
              ₹ {formatCurrency(netPayable)}
            </Typography>
          </Box>
        </Box>

        {/* Amount In Words Row */}
        <Box
          sx={{
            bgcolor: "#f8fafc",
            py: 0.7,
            px: 2,
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>
            Amount in Words
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#475569" }}>:</Typography>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 500, color: "#0f172a" }}>
            {amountInWords}
          </Typography>
        </Box>
      </Box>

      {/* ── 6. NOTES & SIGNATURE SECTION ─────────────────────────────── */}
      <Box
        sx={{
          mt: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 2,
        }}
      >
        {/* Left: Notes */}
        <Box sx={{ maxWidth: "480px" }}>
          <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", color: "#0f172a", mb: 0.3 }}>
            Note:
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.4 }}>
            1. This is a computer generated payslip and does not require a signature.<br />
            2. For any queries, please contact the HR department.<br />
            3. All amounts are in Indian Rupees (₹).
          </Typography>
        </Box>

        {/* Right: Signature */}
        <Box sx={{ textAlign: "center", minWidth: "190px" }}>
          <Typography sx={{ fontSize: "0.75rem", color: "#475569", mb: 3 }}>
            Date: {generatedDate}
          </Typography>
          <Box sx={{ borderTop: "1px solid #0f172a", pt: 0.5 }}>
            <Typography sx={{ fontSize: "0.76rem", color: "#475569" }}>
              Authorised Signatory
            </Typography>
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f2347" }}>
              Vanurtech Pvt Ltd
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── 7. BOTTOM BANNER ────────────────────────────────────────── */}
      <Box
        sx={{
          mt: 2.5,
          bgcolor: "#e8f2fe",
          py: 0.9,
          px: 2,
          borderRadius: "6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography sx={{ fontWeight: 800, color: "#1d4ed8", fontSize: "0.88rem" }}>
          Thank you for your hard work!
        </Typography>
        <Typography sx={{ fontWeight: 600, color: "#1d4ed8", fontSize: "0.75rem" }}>
          Clean Energy &nbsp;|&nbsp; Reliable Service &nbsp;|&nbsp; Brighter Tomorrow
        </Typography>
      </Box>
    </Box>
  );
});

// Sub-component for Key-Value display in employee details
function DetailRow({ label, value, isBold = false }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "135px 15px 1fr", alignItems: "center" }}>
      <Typography sx={{ fontSize: "0.78rem", color: "#334155", fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>:</Typography>
      <Typography
        sx={{
          fontSize: "0.78rem",
          fontWeight: isBold ? 800 : 600,
          color: "#0f172a",
        }}
      >
        {value || "—"}
      </Typography>
    </Box>
  );
}

// ─── PDF DOWNLOAD HELPER USING HTML2CANVAS & JSPDF ───────────────────────────
function loadLocalScript(src, globalCheck) {
  if (globalCheck && globalCheck()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export async function downloadSlipAsPdf(targetNode, fileName = "Salary-Slip.pdf") {
  if (!targetNode) throw new Error("Salary slip preview element is not ready.");

  await Promise.all([
    loadLocalScript("/vendor/jspdf.umd.min.js", () => window.jspdf?.jsPDF),
    loadLocalScript("/vendor/html2canvas.min.js", () => window.html2canvas),
  ]);

  const jsPDF = window.jspdf?.jsPDF;
  const html2canvas = window.html2canvas;
  if (!jsPDF || !html2canvas) throw new Error("PDF generation libraries failed to load.");

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = await html2canvas(targetNode, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    width: targetNode.scrollWidth,
    height: targetNode.scrollHeight,
    windowWidth: Math.max(targetNode.scrollWidth, document.documentElement.clientWidth),
    windowHeight: Math.max(targetNode.scrollHeight, document.documentElement.clientHeight),
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const sliceHeight = Math.max(1, Math.floor((usableHeight * canvas.width) / usableWidth));

  if (canvas.height <= sliceHeight) {
    const imgHeight = (canvas.height * usableWidth) / canvas.width;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.98), "JPEG", margin, margin, usableWidth, imgHeight);
  } else {
    let offsetY = 0;
    let pageIndex = 0;

    while (offsetY < canvas.height) {
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.min(sliceHeight, canvas.height - offsetY);

      const pageContext = pageCanvas.getContext("2d");
      if (!pageContext) break;

      pageContext.fillStyle = "#ffffff";
      pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageContext.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        pageCanvas.height,
        0,
        0,
        canvas.width,
        pageCanvas.height,
      );

      if (pageIndex > 0) {
        pdf.addPage();
      }

      const currentImgHeight = (pageCanvas.height * usableWidth) / pageCanvas.width;
      pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.98), "JPEG", margin, margin, usableWidth, currentImgHeight);

      offsetY += pageCanvas.height;
      pageIndex += 1;
    }
  }

  pdf.save(fileName);
}

// ─── SALARY SLIP MODAL WRAPPER (FOR PREVIEW / PRINT / DOWNLOAD) ─────────────────
export default function SalarySlipModal({ open, onClose, slipData }) {
  const slipRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!open || !slipData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!slipRef.current) return;
    try {
      setDownloading(true);
      const empName = (slipData?.name || slipData?.employeeName || "Employee")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      const monthStr = (slipData?.month || "Salary_Slip")
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `Salary_Slip_${empName}_${monthStr}.pdf`;

      await downloadSlipAsPdf(slipRef.current, fileName);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      // Fallback to browser print if script loading or canvas fails
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          bgcolor: "#f8fafc",
          backgroundImage: "none",
          p: 0,
        },
      }}
    >
      <PrintStyleTag />
      {/* Modal Actions Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 1.5,
          bgcolor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#0f172a" }}>
          Salary Slip Preview — {slipData?.name || "Employee"} ({slipData?.month || "August 2026"})
        </Typography>
        <IconButton size="small" onClick={onClose} disabled={downloading}>
          <Close sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Slip Content View */}
      <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: "#f1f5f9" }}>
        <SalarySlipView ref={slipRef} slipData={slipData} />
      </DialogContent>

      {/* Modal Actions Footer */}
      <DialogActions
        sx={{
          px: 3,
          py: 1.8,
          bgcolor: "#ffffff",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button
          onClick={onClose}
          disabled={downloading}
          sx={{ textTransform: "none", fontWeight: 700, color: "#64748b" }}
        >
          Close
        </Button>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrint}
            disabled={downloading}
            sx={{ textTransform: "none", fontWeight: 700, borderColor: "#cbd5e1", color: "#334155" }}
          >
            Print Slip
          </Button>
          <Button
            variant="contained"
            startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <Download />}
            onClick={handleDownloadPdf}
            disabled={downloading}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#1d68f0",
              "&:hover": { bgcolor: "#1955c4" },
            }}
          >
            {downloading ? "Generating PDF..." : "Download PDF"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
