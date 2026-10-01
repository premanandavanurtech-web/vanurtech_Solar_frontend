import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert, alpha, Autocomplete, Box, Button, Chip, CircularProgress, Divider, FormControl,
  IconButton, InputLabel, MenuItem, Paper, Select, Stack, Switch,
  TextField, Typography, Tooltip, useTheme,
} from "@mui/material";
import {
  Add, ArrowBack, BuildCircleOutlined, CalculateOutlined, DeleteOutline,
  DescriptionOutlined, HighlightOff, LayersOutlined, PaymentsOutlined,
  SettingsOutlined, TuneOutlined, VisibilityOutlined, VerifiedOutlined,
  CheckCircleOutline, InfoOutlined, Inventory2, Refresh,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import axiosInstance from "../utils/axiosConfig";
import { buildQuotationRecord, loadCurrentQuotation, upsertQuotation } from "../utils/quotationStorage";

// ─── constants ──────────────────────────────────────────────────────────────
const BRAND = "#2563eb";
const BRAND_LIGHT = "#e6f1fb";
const BRAND_TEXT = "#0c447c";

const steps = [
  { id: 1, label: "Customer & system",    icon: <SettingsOutlined fontSize="small" /> },
  { id: 2, label: "Components",           icon: <LayersOutlined fontSize="small" /> },
  { id: 3, label: "Warranty & BOS",       icon: <VerifiedOutlined fontSize="small" /> },
  { id: 4, label: "Financial",            icon: <CalculateOutlined fontSize="small" /> },
  { id: 5, label: "Payment schedule",     icon: <PaymentsOutlined fontSize="small" /> },
  { id: 6, label: "Sections to show",     icon: <VisibilityOutlined fontSize="small" /> },
  { id: 7, label: "Installation",         icon: <BuildCircleOutlined fontSize="small" /> },
  { id: 8, label: "Terms & conditions",   icon: <DescriptionOutlined fontSize="small" /> },
];

const subsidyOptions  = ["No subsidy","PM Surya Ghar (First 2kW) (₹30,000/kW)","PM Surya Ghar (Additional 1kW) (₹30,000/kW)","PM Surya Ghar (Max for >3kW) (₹78,000)"];
const batteryBrands   = ["Luminous","Deye","UTL"];
const batteryTypes    = ["LFP","Lead Acid","Lithium-ion"];
const customerTypes   = ["Residential","Commercial"];
const salutations     = ["None","Mr.","Mrs.","Ms.","M/s"];
const systemTypes     = ["On-grid","Off-grid","Hybrid"];
const panelBrands     = ["Waaree Energies","Goldi Solar","Axitec Solar","Renewsys India","Panasonic Solar","EMVEE","Havells","Premier Energies","UTL"];
const panelCategories = ["Bifacial","TopCon (N-Type)"];
const inverterBrands  = ["Havells Solar","Luminous","Sungrow","Goodwe","Solis","Microtek","Polycab Solar","Deye Solar","Ksolar"];
const cableBrands     = ["Havells","Polycab","KEI Industries","RR Kabel","V-Guard","Lapp India","Anchor by Panasonic","Standard by Havells"];
const structureTypes  = ["GI Hot Dip Galvanized - Elevated Tilt","Aluminium Alloy - Roof Mount","GI - RCC Roof Ballast","Mono rail","Pre GI structures"];
const structureBrands = ["Apollo","Jindal"];
const structureSizes  = ["120*40","80*40","100*50"];
const phaseOptions    = ["Single Phase","Three Phase"];
const inverterTypes   = ["String","Micro","Central"];
const netMeterOptions = ["HPL","Genus","Secure","L&T","Schneider"];

const inventoryItemsCatalog = [
  // Solar Panels
  { id: "p1", category: "Solar Panels", subcategory: "TopCon (N-Type)", itemName: "Waaree 540W TopCon (N-Type)", brand: "Waaree Energies", wattPeak: "540", price: 14500, stock: 420 },
  { id: "p2", category: "Solar Panels", subcategory: "TopCon (N-Type)", itemName: "Goldi 550W TopCon (N-Type)", brand: "Goldi Solar", wattPeak: "550", price: 15200, stock: 180 },
  { id: "p3", category: "Solar Panels", subcategory: "Bifacial Mono PERC", itemName: "Adani 540W Bifacial Dual Glass", brand: "Adani Solar", wattPeak: "540", price: 16000, stock: 95 },
  { id: "p4", category: "Solar Panels", subcategory: "Bifacial Mono PERC", itemName: "Vikram 545W Bifacial Mono PERC", brand: "Vikram Solar", wattPeak: "545", price: 15500, stock: 230 },
  { id: "p5", category: "Solar Panels", subcategory: "Mono PERC", itemName: "Renewsys 540W Mono PERC", brand: "Renewsys India", wattPeak: "540", price: 13800, stock: 310 },
  { id: "p6", category: "Solar Panels", subcategory: "Mono PERC", itemName: "Premier 535W Mono PERC", brand: "Premier Energies", wattPeak: "535", price: 13500, stock: 60 },

  // Inverters
  { id: "i1", category: "Inverters", subcategory: "On-Grid String", itemName: "Havells 5kW 3-Phase String Inverter", brand: "Havells Solar", size: "5", phase: "Three Phase", type: "String", price: 42000, stock: 45 },
  { id: "i2", category: "Inverters", subcategory: "On-Grid String", itemName: "Sungrow 10kW 3-Phase Inverter", brand: "Sungrow", size: "10", phase: "Three Phase", type: "String", price: 68000, stock: 22 },
  { id: "i3", category: "Inverters", subcategory: "Hybrid", itemName: "Deye 8kW Hybrid Inverter LFP", brand: "Deye Solar", size: "8", phase: "Three Phase", type: "Micro", price: 95000, stock: 12 },
  { id: "i4", category: "Inverters", subcategory: "Off-Grid", itemName: "Luminous 3kW Off-Grid Inverter", brand: "Luminous", size: "3", phase: "Single Phase", type: "String", price: 28000, stock: 35 },
];

const sectionShowDefaults = [
  { label: "Rooftop Layout & Design (page)", enabled: true },
  { label: "Site Survey Photos (page)", enabled: true },
  { label: "Technical Specifications (page)", enabled: true },
  { label: "Energy & Financial Summary (page)", enabled: true },
  { label: "Monthly Energy Generation Chart", enabled: true },
  { label: "Year-wise Savings & Payback Table", enabled: true },
  { label: "25-Year Savings Impact", enabled: true },
  { label: "Payment Schedule (milestones)", enabled: true },
  { label: "Why Go Solar (page)", enabled: true },
  { label: "Installation Process (page)", enabled: true },
  { label: "Warranty & Support (page)", enabled: true },
  { label: "Terms & Conditions (page)", enabled: true },
];

const initialInstallationSteps = [
  { title: "1. Site Survey & Engineering Assessment", description: "Detailed structural assessment of rooftop, shading analysis, load audit, electrical panel inspection, and preparation of site-specific layout drawing and single-line diagram (SLD)." },
  { title: "2. DISCOM Application", description: "Submission of DISCOM application along with all required documentation and approvals. Our team handles all paperwork end-to-end." },
  { title: "3. Material Procurement", description: "All materials procured from authorised distributors. Each component undergoes incoming quality inspection." },
  { title: "4. Mounting Structure Installation", description: "Precision drilling and anchor fixing. Structure assembled at engineered tilt angle. Waterproofing applied at all roof penetration points." },
  { title: "5. Panel, Inverter & Electrical Installation", description: "Solar panel placement, MC4 connector crimping, inverter wall mounting, AC cabling to ACDB, RCCB, and main distribution board. Earthing and lightning protection installed." },
  { title: "6. Net Metering", description: "DISCOM inspection, net meter installation and grid synchronisation. Final testing, commissioning, client walkthrough and handover with training on the monitoring portal." },
];

const initialTermsGroups = [
  { heading: "Quotation Validity", points: ["This quotation is valid for the number of days stated above from the date of issue.","Prices are subject to change after validity period due to panel cost fluctuations and GST policy revisions.","Subsidy amounts are based on MNRE guidelines as of the date of issue and are subject to Government revision."] },
  { heading: "Installation & Scope", points: ["Scope includes supply, installation, testing, commissioning, and net metering documentation only.","Civil works, if required, will be quoted separately after site survey.","Customer to provide access to rooftop, electrical panel, and parking for installation vehicles throughout the installation period."] },
  { heading: "Performance & Liability", points: ["Generation estimates are based on solar irradiance data for the installation location. Actual generation may vary by +/-10%.","We are not liable for generation losses due to grid downtime, excessive shading from new construction, or acts of God.","All warranties are subject to the customer maintaining the system in accordance with the maintenance guidelines."] },
  { heading: "Cancellation Policy", points: ["Order cancellation before material dispatch: 5% of advance amount will be retained as processing charges.","Cancellation post material dispatch: 30% of project value will be retained to cover material, logistics, and engineering costs, and material needs to be returned."] },
];

// ─── design tokens & theme helper ──────────────────────────────────────────
const getInputSx = (isDark) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: isDark ? "#0f172a" : "#fff",
    color: isDark ? "#f1f5f9" : "#1f2937",
    fontSize: "0.875rem",
    "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)" },
    "&:hover fieldset": { borderColor: isDark ? "#60a5fa" : BRAND },
    "&.Mui-focused fieldset": { borderColor: isDark ? "#60a5fa" : BRAND, borderWidth: 1.5 },
    "& .MuiSelect-icon": { color: isDark ? "#94a3b8" : "inherit" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: isDark ? "#60a5fa" : BRAND },
  "& .MuiInputLabel-root": { fontSize: "0.875rem", color: isDark ? "#94a3b8" : "inherit" },
});

// ─── shared small components ─────────────────────────────────────────────────
function Block({ label, children, sx }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 2,
        borderRadius: 3,
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "0.5px solid rgba(0,0,0,0.09)",
        bgcolor: isDark ? "#1e293b" : "#fff",
        boxShadow: "none",
        ...sx,
      }}
    >
      {label && (
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: isDark ? "#94a3b8" : "#94a3b8",
            mb: 1.75,
          }}
        >
          {label}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

function G({ cols = 4, children, sx }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: `repeat(${Math.min(cols, 2)}, minmax(0,1fr))`, md: `repeat(${cols}, minmax(0,1fr))` },
        gap: 2,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function F({ label, children, span, hint }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box sx={span ? { gridColumn: `span ${span}` } : {}}>
      {children}
      {hint && (
        <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", mt: 0.5, display: "block" }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

function TF({ label, sx, ...props }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return <TextField label={label} size="small" fullWidth sx={{ ...getInputSx(isDark), ...sx }} {...props} />;
}

function Sel({ label, value, onChange, options }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <FormControl fullWidth size="small" sx={getInputSx(isDark)}>
      <InputLabel sx={{ fontSize: "0.875rem", color: isDark ? "#94a3b8" : undefined }}>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={onChange}
        sx={{
          borderRadius: 2,
          fontSize: "0.875rem",
          bgcolor: isDark ? "#0f172a" : "#fff",
          color: isDark ? "#f1f5f9" : "#1f2937",
          "& .MuiSelect-icon": { color: isDark ? "#94a3b8" : undefined },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              bgcolor: isDark ? "#1e293b" : "#fff",
              color: isDark ? "#f1f5f9" : "#1f2937",
              "& .MuiMenuItem-root": {
                "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.08)" : undefined },
                "&.Mui-selected": { bgcolor: isDark ? "rgba(59,130,246,0.2)" : undefined },
              },
            },
          },
        }}
      >
        {options.map((o) => (
          <MenuItem key={o} value={o} sx={{ fontSize: "0.875rem" }}>
            {o === "None" ? "— None —" : o}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function ChipAC({ label, value, options, onChange, freeSolo, placeholder }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Autocomplete
      multiple
      freeSolo={freeSolo}
      options={options}
      value={value ? [value] : []}
      onChange={(_, vals) => onChange(vals[vals.length - 1] || "")}
      onInputChange={freeSolo ? (_, v) => onChange(v || "") : undefined}
      filterSelectedOptions
      fullWidth
      size="small"
      renderTags={(vals, getTagProps) =>
        vals.map((opt, i) => (
          <Chip
            {...getTagProps({ index: i })}
            key={opt}
            label={opt}
            size="small"
            sx={{
              borderRadius: 1.5,
              bgcolor: isDark ? "rgba(59,130,246,0.2)" : undefined,
              color: isDark ? "#93c5fd" : undefined,
            }}
          />
        ))
      }
      renderInput={(params) => <TextField {...params} label={label} placeholder={placeholder} sx={getInputSx(isDark)} />}
      PaperComponent={(props) => (
        <Paper
          {...props}
          sx={{
            bgcolor: isDark ? "#1e293b" : "#fff",
            color: isDark ? "#f1f5f9" : "#1f2937",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : undefined,
            "& .MuiAutocomplete-option": {
              "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.08)" : undefined },
              "&[aria-selected='true']": { bgcolor: isDark ? "rgba(59,130,246,0.2)" : undefined },
            },
          }}
        />
      )}
    />
  );
}

function SectionHeader({ icon, title }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2.5,
            bgcolor: isDark ? "rgba(59, 130, 246, 0.2)" : BRAND_LIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isDark ? "#60a5fa" : BRAND,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, color: isDark ? "#f8fafc" : "#1f2937" }}>
          {title}
        </Typography>
      </Stack>
      <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : undefined }} />
    </Box>
  );
}

function BlockLabel({ title, hint }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Typography
      sx={{
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: isDark ? "#94a3b8" : "#94a3b8",
        mb: 1.75,
      }}
    >
      {title}
      {hint && (
        <Box component="span" sx={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: isDark ? "#64748b" : "#b0bec5", ml: 0.75 }}>
          — {hint}
        </Box>
      )}
    </Typography>
  );
}

function ToggleRow({ label, checked, onChange }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box
      sx={{
        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "0.5px solid rgba(0,0,0,0.1)",
        borderRadius: 999,
        px: 2,
        py: 1.1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: isDark ? "#0f172a" : "#fff",
      }}
    >
      <Typography sx={{ fontSize: "0.875rem", color: isDark ? "#e2e8f0" : "#475569" }}>{label}</Typography>
      <Switch
        checked={checked}
        onChange={onChange}
        size="small"
        sx={{
          "& .MuiSwitch-thumb": { width: 14, height: 14 },
          "& .Mui-checked .MuiSwitch-thumb": { bgcolor: isDark ? "#60a5fa" : BRAND },
          "& .Mui-checked + .MuiSwitch-track": { bgcolor: isDark ? "#3b82f6" : BRAND },
        }}
      />
    </Box>
  );
}

function FooterActions({ onCancel, onSave, saveLabel }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 1.5,
        mt: 2,
        pt: 2.5,
        borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "0.5px solid rgba(0,0,0,0.08)",
      }}
    >
      <Button
        variant="outlined"
        onClick={onCancel}
        sx={{
          borderRadius: 2,
          px: 3,
          textTransform: "none",
          borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)",
          color: isDark ? "#cbd5e1" : "#475569",
          "&:hover": {
            borderColor: isDark ? "#60a5fa" : BRAND,
            color: isDark ? "#60a5fa" : BRAND,
            bgcolor: isDark ? "rgba(59,130,246,0.15)" : BRAND_LIGHT,
          },
        }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        startIcon={<CheckCircleOutline fontSize="small" />}
        onClick={onSave}
        sx={{
          borderRadius: 2,
          px: 3,
          textTransform: "none",
          bgcolor: isDark ? "#2563eb" : BRAND,
          boxShadow: "none",
          "&:hover": { bgcolor: "#1d4ed8", boxShadow: "none" },
        }}
      >
        {saveLabel}
      </Button>
    </Box>
  );
}

// ─── step renderers ──────────────────────────────────────────────────────────
function StepCustomer({ form, updateField, updateValue, pricePerKw }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const inputSx = getInputSx(isDark);

  return (
    <Stack spacing={0}>
      <SectionHeader icon={<TuneOutlined />} title="Customer & system" />

      <Block label="System overview">
        <G cols={4} sx={{ mb: 2 }}>
          <TF label="System size (kW) *" value={form.systemSize} onChange={updateField("systemSize")} />
          <TF label="Total cost (₹) *" value={form.totalCost} onChange={updateField("totalCost")} />
          <TF
            label="Price per kW"
            value={pricePerKw}
            InputProps={{ readOnly: true }}
            sx={{
              ...inputSx,
              "& .MuiOutlinedInput-root": {
                ...inputSx["& .MuiOutlinedInput-root"],
                bgcolor: isDark ? "#0f172a" : "#f8fafc",
                color: isDark ? "#94a3b8" : "#64748b",
              },
            }}
          />
          <F hint="Leave blank to match system size">
            <TF label="Structure capacity (kW)" value={form.structureCapacity} onChange={updateField("structureCapacity")} placeholder="Defaults to system size" />
          </F>
        </G>
        <G cols={3} sx={{ mb: 2 }}>
          <Sel label="Government subsidy" value={form.governmentSubsidy} onChange={updateField("governmentSubsidy")} options={subsidyOptions} />
          <F hint="Auto-calculated from scheme, editable">
            <TF label="Subsidy amount (₹)" value={form.subsidyAmount} onChange={updateField("subsidyAmount")} />
          </F>
          <Sel label="System type" value={form.systemType} onChange={updateField("systemType")} options={systemTypes} />
        </G>
        <G cols={2}>
          <ToggleRow label="Battery backup" checked={form.batteryBackup} onChange={updateField("batteryBackup")} />
          <ToggleRow label="Finance required" checked={form.financeRequired} onChange={updateField("financeRequired")} />
        </G>
      </Block>

      <Block label="Battery details">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr 80px 80px" }, gap: 2, mb: 2 }}>
          <ChipAC label="Battery brand" options={batteryBrands} value={form.batteryBrand} onChange={updateValue("batteryBrand")} />
          <TF label="Capacity (kWh)" value={form.batteryCapacity} onChange={updateField("batteryCapacity")} />
          <Sel label="Type" value={form.batteryType} onChange={updateField("batteryType")} options={batteryTypes} />
          <TF label="Qty" value={form.batteryQty} onChange={updateField("batteryQty")} />
          <TF label="Wty (yr)" value={form.batteryWarranty} onChange={updateField("batteryWarranty")} />
        </Box>
        <Alert
          severity="info"
          icon={<InfoOutlined fontSize="small" />}
          sx={{
            borderRadius: 2,
            bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : BRAND_LIGHT,
            color: isDark ? "#93c5fd" : BRAND_TEXT,
            border: isDark ? "1px solid rgba(59, 130, 246, 0.3)" : "0.5px solid #b5d4f4",
            fontSize: "0.8rem",
            "& .MuiAlert-icon": { color: isDark ? "#93c5fd" : BRAND_TEXT },
          }}
        >
          Site survey incomplete. Missing equipment fields must be filled manually.
        </Alert>
      </Block>

      <Block label="Customer details">
        <G cols={4}>
          <Sel label="Salutation" value={form.salutation} onChange={updateField("salutation")} options={salutations} />
          <Sel label="Customer type *" value={form.customerType} onChange={updateField("customerType")} options={customerTypes} />
          <TF label="Monthly bill (₹)" value={form.monthlyBill} onChange={updateField("monthlyBill")} placeholder="Optional" />
          <TF label="Roof area (sq ft) *" value={form.roofArea} onChange={updateField("roofArea")} />
        </G>
      </Block>
    </Stack>
  );
}

function StepComponents({ form, updateField, updateValue }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [liveItems, setLiveItems] = useState(inventoryItemsCatalog);
  const [fetchingInventory, setFetchingInventory] = useState(false);
  const getItemStock = (item) => {
    const stockRows = Array.isArray(item?.warehouseStock) ? item.warehouseStock : [];
    const rowStock = stockRows.reduce(
      (sum, row) => sum + Number(row.availableQty ?? row.quantity ?? row.qty ?? 0),
      0,
    );
    return Number(item?.availableStock ?? item?.totalStock ?? item?.openingStock ?? rowStock ?? 0);
  };
  const renderInventoryOption = (props, option) => (
    <Box component="li" {...props} key={option.id || option.itemName}>
      <Stack spacing={0.4} sx={{ width: "100%", minWidth: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography fontWeight={800} noWrap sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
            {option.itemName}
          </Typography>
          <Chip
            size="small"
            label={`Stock: ${option.stock}`}
            sx={{
              flexShrink: 0,
              height: 22,
              fontWeight: 800,
              bgcolor: option.stock > 0 ? alpha("#22c55e", isDark ? 0.18 : 0.12) : alpha("#ef4444", isDark ? 0.18 : 0.12),
              color: option.stock > 0 ? (isDark ? "#86efac" : "#15803d") : "#ef4444",
            }}
          />
        </Stack>
        <Typography variant="caption" noWrap sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
          Category: {option.category || "-"} | Subcategory: {option.subcategory || "-"}
        </Typography>
      </Stack>
    </Box>
  );

  useEffect(() => {
    let isMounted = true;
    const fetchLiveInventory = async () => {
      try {
        setFetchingInventory(true);
        const res = await axiosInstance.get("/inventory/items", { params: { limit: 500 } });
        const data = res.data?.result?.items || (Array.isArray(res.data?.result) ? res.data.result : []);
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const parsed = data.map((item) => {
            const rawCat = typeof item.category === "object" ? item.category?.category : item.category;
            const priceVal = item.pricing?.sellingPrice || item.pricing?.purchaseCost || item.price || 0;
            const stockVal = getItemStock(item);
            return {
              id: item._id,
              category: rawCat || "Solar Panels",
              subcategory: item.subcategory || "General",
              itemName: item.itemName || item.name,
              brand: item.purchaseInfo?.vendorName || item.brand || item.itemName?.split(" ")[0] || "Standard",
              wattPeak: item.wattPeak || String(item.itemName?.match(/\d{3}/)?.[0] || "540"),
              size: item.size || String(item.itemName?.match(/\d+(\.\d+)?\s*k[wW]/i)?.[0]?.replace(/k[wW]/i, "") || "5"),
              price: Number(priceVal),
              stock: Number(stockVal),
            };
          });
          setLiveItems((prev) => {
            const merged = [...parsed];
            prev.forEach((p) => {
              if (!merged.some((m) => m.itemName === p.itemName)) merged.push(p);
            });
            return merged;
          });
        }
      } catch (err) {
        console.warn("Using fallback inventory catalog", err);
      } finally {
        if (isMounted) setFetchingInventory(false);
      }
    };
    fetchLiveInventory();
    return () => { isMounted = false; };
  }, []);

  const componentItems = Array.isArray(form.componentItems) ? form.componentItems : [];
  const [componentCategory, setComponentCategory] = useState("");
  const [componentSubcategory, setComponentSubcategory] = useState("");
  const [selectedComponentItem, setSelectedComponentItem] = useState(null);
  const [componentQty, setComponentQty] = useState("1");

  const allCategoriesList = useMemo(() => {
    const set = new Set(liveItems.map((i) => i.category).filter(Boolean));
    return Array.from(set).sort();
  }, [liveItems]);

  const subcategoryOptions = useMemo(() => {
    const set = new Set(
      liveItems
        .filter((i) => !componentCategory || i.category === componentCategory)
        .map((i) => i.subcategory)
        .filter(Boolean),
    );
    return Array.from(set).sort();
  }, [liveItems, componentCategory]);

  const availableComponentItems = useMemo(() => {
    return liveItems.filter(
      (i) =>
        (!componentCategory || i.category === componentCategory) &&
        (!componentSubcategory || i.subcategory === componentSubcategory),
    );
  }, [liveItems, componentCategory, componentSubcategory]);

  const componentTotal = useMemo(
    () => componentItems.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0), 0),
    [componentItems],
  );

  const syncLegacyComponentFields = (item, qty) => {
    const categoryText = `${item.category || ""} ${item.subcategory || ""}`.toLowerCase();
    if (categoryText.includes("solar") || categoryText.includes("panel")) {
      if (item.wattPeak) updateValue("wattPeak")(item.wattPeak);
      if (qty) updateValue("panelQty")(String(qty));
      if (item.brand) updateValue("panelBrand")(item.brand);
      if (item.subcategory) updateValue("panelCategory")(item.subcategory);
      if (item.price) updateValue("panelUnitPrice")(item.price);
    }
    if (categoryText.includes("inverter")) {
      if (item.size) updateValue("inverterSize")(item.size);
      if (qty) updateValue("inverterQty")(String(qty));
      if (item.brand) updateValue("inverterBrand")(item.brand);
      if (item.phase) updateValue("phase")(item.phase);
      if (item.type) updateValue("inverterType")(item.type);
      if (item.price) updateValue("inverterUnitPrice")(item.price);
    }
  };

  const handleAddComponentItem = () => {
    if (!selectedComponentItem) return;
    const qty = Math.max(1, Number(componentQty) || 1);
    const nextRow = {
      id: `${selectedComponentItem.id || selectedComponentItem.itemName}-${Date.now()}`,
      inventoryId: selectedComponentItem.id || "",
      itemName: selectedComponentItem.itemName || "",
      category: selectedComponentItem.category || "",
      subcategory: selectedComponentItem.subcategory || "",
      brand: selectedComponentItem.brand || "",
      qty,
      price: Number(selectedComponentItem.price || 0),
      stock: Number(selectedComponentItem.stock || 0),
      wattPeak: selectedComponentItem.wattPeak || "",
      size: selectedComponentItem.size || "",
    };

    updateValue("componentItems")([...componentItems, nextRow]);
    syncLegacyComponentFields(selectedComponentItem, qty);
    setSelectedComponentItem(null);
    setComponentQty("1");
  };

  const handleRemoveComponentItem = (rowId) => {
    updateValue("componentItems")(componentItems.filter((item) => item.id !== rowId));
  };

  const InventorySummary = ({ item, stockWarningAt = 20 }) => {
    if (!item) {
      return (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? "rgba(15,23,42,0.82)" : "#f8fafc", border: `1px dashed ${isDark ? "rgba(148,163,184,0.28)" : "#cbd5e1"}` }}>
          <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            Select an inventory item to see category, subcategory, price, and stock.
          </Typography>
        </Paper>
      );
    }

    const stock = Number(item.stock || 0);
    const stockColor = stock <= 0 ? "#ef4444" : stock <= stockWarningAt ? "#f59e0b" : "#22c55e";

    return (
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: isDark ? "rgba(15,23,42,0.84)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(148,163,184,0.22)" : "#dbe5ef"}` }}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: alpha(BRAND, isDark ? 0.22 : 0.12), color: isDark ? "#93c5fd" : BRAND, display: "grid", placeItems: "center", flexShrink: 0 }}>
              <Inventory2 fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={900} noWrap color={isDark ? "#f8fafc" : "#0f172a"}>
                {item.itemName}
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.8 }}>
                <Chip size="small" label={item.category || "-"} sx={{ height: 23, fontWeight: 800, bgcolor: alpha("#3b82f6", isDark ? 0.18 : 0.1), color: isDark ? "#93c5fd" : "#1d4ed8" }} />
                <Chip size="small" label={item.subcategory || "-"} sx={{ height: 23, fontWeight: 800, bgcolor: isDark ? "rgba(148,163,184,0.12)" : "#eef2f7", color: isDark ? "#cbd5e1" : "#475569" }} />
                <Chip size="small" label={`Brand: ${item.brand || "-"}`} sx={{ height: 23, fontWeight: 800, bgcolor: isDark ? "rgba(148,163,184,0.12)" : "#eef2f7", color: isDark ? "#cbd5e1" : "#475569" }} />
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: "flex-start", md: "flex-end" }}>
            <Chip icon={<PaymentsOutlined sx={{ fontSize: 16 }} />} label={`Price: Rs ${Number(item.price || 0).toLocaleString("en-IN")}`} sx={{ fontWeight: 900, bgcolor: alpha("#10b981", isDark ? 0.18 : 0.12), color: isDark ? "#86efac" : "#047857", border: `1px solid ${alpha("#10b981", 0.32)}` }} />
            <Chip icon={<LayersOutlined sx={{ fontSize: 16 }} />} label={`Stock: ${stock} units`} sx={{ fontWeight: 900, bgcolor: alpha(stockColor, isDark ? 0.18 : 0.12), color: stockColor, border: `1px solid ${alpha(stockColor, 0.38)}` }} />
          </Stack>
        </Stack>
      </Paper>
    );
  };

  return (
    <Stack spacing={0}>
      <SectionHeader icon={<LayersOutlined />} title="Components" />

      <Block sx={{ p: 0, overflow: "hidden", bgcolor: isDark ? "#172033" : "#fff", border: isDark ? "1px solid rgba(148,163,184,0.16)" : "1px solid #e2e8f0" }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: isDark ? "1px solid rgba(148,163,184,0.14)" : "1px solid #e2e8f0" }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={1.5}>
            <Box>
              <Typography fontWeight={900} color={isDark ? "#f8fafc" : "#0f172a"}>Add inventory items</Typography>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                Select an item, enter quantity, then press Add item. Repeat for multiple products.
              </Typography>
            </Box>
            <Chip size="small" label={`${componentItems.length} added`} sx={{ fontWeight: 900, bgcolor: alpha(BRAND, isDark ? 0.2 : 0.1), color: isDark ? "#93c5fd" : BRAND }} />
          </Stack>
        </Box>

        <Box sx={{ p: 2.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.8fr 0.8fr 1.6fr 0.45fr auto" }, gap: 1.5, alignItems: "center" }}>
            <ChipAC
              label="Category"
              options={allCategoriesList}
              value={componentCategory}
              onChange={(val) => {
                setComponentCategory(val || "");
                setComponentSubcategory("");
                setSelectedComponentItem(null);
              }}
            />
            <ChipAC
              label="Subcategory"
              options={subcategoryOptions}
              value={componentSubcategory}
              onChange={(val) => {
                setComponentSubcategory(val || "");
                setSelectedComponentItem(null);
              }}
            />
            <Autocomplete
              options={availableComponentItems}
              getOptionLabel={(opt) => (typeof opt === "string" ? opt : `${opt.itemName} (Stock: ${opt.stock})`)}
              renderOption={renderInventoryOption}
              value={selectedComponentItem}
              onChange={(_, newItem) => {
                setSelectedComponentItem(newItem);
                if (newItem?.category) setComponentCategory(newItem.category);
                if (newItem?.subcategory) setComponentSubcategory(newItem.subcategory);
              }}
              size="small"
              fullWidth
              loading={fetchingInventory}
              renderInput={(p) => <TextField {...p} label="Item" placeholder="Search inventory item" sx={getInputSx(isDark)} />}
              PaperComponent={(props) => (
                <Paper
                  {...props}
                  sx={{
                    bgcolor: isDark ? "#1e293b" : "#fff",
                    color: isDark ? "#f1f5f9" : "#1f2937",
                    border: isDark ? "1px solid rgba(255,255,255,0.1)" : undefined,
                  }}
                />
              )}
            />
            <TF label="Qty" type="number" value={componentQty} onChange={(e) => setComponentQty(e.target.value)} inputProps={{ min: 1 }} />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddComponentItem}
              disabled={!selectedComponentItem}
              sx={{ minHeight: 40, px: 2.5, borderRadius: 2, fontWeight: 900, whiteSpace: "nowrap", bgcolor: BRAND, "&:hover": { bgcolor: "#1d4ed8" } }}
            >
              Add item
            </Button>
          </Box>

          <Box sx={{ mt: 2 }}>
            <InventorySummary item={selectedComponentItem} stockWarningAt={20} />
          </Box>
        </Box>
      </Block>

      <Block label="Added items">
        {componentItems.length === 0 ? (
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? "rgba(15,23,42,0.65)" : "#f8fafc", border: `1px dashed ${isDark ? "rgba(148,163,184,0.25)" : "#cbd5e1"}` }}>
            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              No item added yet. Use the form above to add solar panels, inverters, cables, or any other inventory item.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.25}>
            {componentItems.map((row, index) => {
              const amount = (Number(row.qty) || 0) * (Number(row.price) || 0);
              return (
                <Paper
                  key={row.id || `${row.itemName}-${index}`}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: isDark ? "rgba(15,23,42,0.72)" : "#f8fafc",
                    border: `1px solid ${isDark ? "rgba(148,163,184,0.18)" : "#e2e8f0"}`,
                  }}
                >
                  <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} spacing={1.5}>
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: alpha(BRAND, isDark ? 0.2 : 0.1), color: isDark ? "#93c5fd" : BRAND, display: "grid", placeItems: "center", flexShrink: 0 }}>
                        <Inventory2 fontSize="small" />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} noWrap color={isDark ? "#f8fafc" : "#0f172a"}>
                          {row.itemName}
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.6 }}>
                          <Chip size="small" label={row.category || "-"} sx={{ height: 22, fontWeight: 800, bgcolor: alpha("#3b82f6", isDark ? 0.18 : 0.1), color: isDark ? "#93c5fd" : "#1d4ed8" }} />
                          <Chip size="small" label={row.subcategory || "-"} sx={{ height: 22, fontWeight: 800, bgcolor: isDark ? "rgba(148,163,184,0.12)" : "#eef2f7", color: isDark ? "#cbd5e1" : "#475569" }} />
                          {row.brand && <Chip size="small" label={row.brand} sx={{ height: 22, fontWeight: 800, bgcolor: isDark ? "rgba(148,163,184,0.12)" : "#eef2f7", color: isDark ? "#cbd5e1" : "#475569" }} />}
                        </Stack>
                      </Box>
                    </Stack>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(88px, 1fr))" }, gap: 1, minWidth: { md: 430 } }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>Qty</Typography>
                        <Typography fontWeight={900} color={isDark ? "#f8fafc" : "#0f172a"}>{row.qty}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>Price</Typography>
                        <Typography fontWeight={900} color={isDark ? "#f8fafc" : "#0f172a"}>Rs {Number(row.price || 0).toLocaleString("en-IN")}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>Stock</Typography>
                        <Typography fontWeight={900} color={Number(row.stock) > 0 ? (isDark ? "#86efac" : "#15803d") : "#ef4444"}>{row.stock}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>Amount</Typography>
                        <Typography fontWeight={900} color={isDark ? "#f8fafc" : "#0f172a"}>Rs {amount.toLocaleString("en-IN")}</Typography>
                      </Box>
                    </Box>

                    <Tooltip title="Remove item">
                      <IconButton onClick={() => handleRemoveComponentItem(row.id)} color="error" sx={{ alignSelf: { xs: "flex-end", md: "center" } }}>
                        <DeleteOutline />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Paper>
              );
            })}

            <Divider sx={{ borderColor: isDark ? "rgba(148,163,184,0.14)" : "#e2e8f0" }} />
            <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
              <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>Items total</Typography>
              <Typography fontWeight={900} color={isDark ? "#f8fafc" : "#0f172a"}>Rs {componentTotal.toLocaleString("en-IN")}</Typography>
            </Stack>
          </Stack>
        )}
      </Block>
      <Block label="Cables & structure">
        <G cols={4} sx={{ mb: 2 }}>
          <ChipAC label="Cable brand" options={cableBrands} value={form.cableBrand} onChange={updateValue("cableBrand")} />
          <TF label="DC cable spec" value={form.dcCableSpec} onChange={updateField("dcCableSpec")} />
          <TF label="AC cable spec" value={form.acCableSpec} onChange={updateField("acCableSpec")} />
          <Autocomplete
            freeSolo
            options={structureTypes}
            value={form.structureType}
            onChange={(_, v) => updateValue("structureType")(v || "")}
            onInputChange={(_, v) => updateValue("structureType")(v)}
            size="small"
            fullWidth
            renderInput={(p) => <TextField {...p} label="Structure type" placeholder="Select or type..." sx={getInputSx(isDark)} />}
            PaperComponent={(props) => (
              <Paper
                {...props}
                sx={{
                  bgcolor: isDark ? "#1e293b" : "#fff",
                  color: isDark ? "#f1f5f9" : "#1f2937",
                  border: isDark ? "1px solid rgba(255,255,255,0.1)" : undefined,
                }}
              />
            )}
          />
        </G>
        <G cols={4}>
          <ChipAC label="Structure size" options={structureSizes} value={form.structureSize} onChange={updateValue("structureSize")} />
          <ChipAC label="Structure brand" options={structureBrands} value={form.structureBrand} onChange={updateValue("structureBrand")} />
        </G>
      </Block>
    </Stack>
  );
}

function StepWarranty({ form, updateField, updateValue }) {
  return (
    <Stack spacing={0}>
      <SectionHeader icon={<VerifiedOutlined />} title="Warranty & BOS" />

      <Block label="Warranty periods">
        <G cols={4}>
          <TF label="Panel (years)" value={form.panelWarrantyYears} onChange={updateField("panelWarrantyYears")} />
          <TF label="Inverter (years)" value={form.inverterWarrantyYears} onChange={updateField("inverterWarrantyYears")} />
          <TF label="BOS (years)" value={form.bosWarrantyYears} onChange={updateField("bosWarrantyYears")} />
          <TF label="Cables (years)" value={form.cableWarrantyYears} onChange={updateField("cableWarrantyYears")} />
        </G>
        <Box sx={{ mt: 2 }}>
          <F hint="Shown on the warranty table in the PDF. Leave blank to use your company template default.">
            <TF label="Performance guarantee" placeholder="e.g. 30 Yr Linear (80% at yr 25)" value={form.performanceGuarantee} onChange={updateField("performanceGuarantee")} />
          </F>
        </Box>
      </Block>

      <Block label="Balance of system">
        <G cols={3} sx={{ mb: 2 }}>
          <ChipAC label="Net & solar meter" options={netMeterOptions} value={form.netSolarMeter} onChange={updateValue("netSolarMeter")} freeSolo placeholder="Select or type brand…" />
          <TF label="DC cables & conduits" value={form.dcCablesConduits} onChange={updateField("dcCablesConduits")} />
          <TF label="DCDB / ACDB" value={form.dcdbAcdb} onChange={updateField("dcdbAcdb")} />
        </G>
        <G cols={2}>
          <TF label="Earthing (pits, strips, cables)" value={form.earthing} onChange={updateField("earthing")} />
          <TF label="Lightning arrestor" value={form.lightningArrestor} onChange={updateField("lightningArrestor")} />
        </G>
      </Block>
    </Stack>
  );
}

function StepFinancial({ form, updateField }) {
  return (
    <Stack spacing={0}>
      <SectionHeader icon={<CalculateOutlined />} title="Financial assumptions" />
      <Block>
        <BlockLabel title="Financial assumptions" hint="Leave blank to use defaults" />
        <G cols={3}>
          <TF label="Electricity tariff (₹/unit)" placeholder="Default 8" value={form.electricityTariff} onChange={updateField("electricityTariff")} />
          <TF label="Tariff escalation (%/year)" placeholder="Default 3" value={form.tariffEscalation} onChange={updateField("tariffEscalation")} />
          <TF label="Panel degradation (%/year)" placeholder="Default 0.5" value={form.panelDegradation} onChange={updateField("panelDegradation")} />
          <TF label="Projection years" placeholder="Default 5" value={form.projectionYears} onChange={updateField("projectionYears")} />
          <TF label="Generation per kW (units/year)" placeholder="Default 1500" value={form.generationPerKw} onChange={updateField("generationPerKw")} />
        </G>
      </Block>
    </Stack>
  );
}

function StepPayment({ paymentMilestones, updateMilestone, addMilestone, removeMilestone, paymentTotal, form, updateField }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const inputSx = getInputSx(isDark);

  return (
    <Stack spacing={0}>
      <SectionHeader icon={<PaymentsOutlined />} title="Payment schedule" />

      <Block>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <BlockLabel title="Payment milestones" />
          <Chip
            label={`Total: ${paymentTotal}%`}
            sx={{
              bgcolor: paymentTotal === 100
                ? (isDark ? "rgba(16, 185, 129, 0.2)" : "#e6f8f4")
                : (isDark ? "rgba(245, 158, 11, 0.2)" : "#fff3e0"),
              color: paymentTotal === 100
                ? (isDark ? "#34d399" : "#085041")
                : (isDark ? "#fbbf24" : "#854f0b"),
              fontWeight: 700,
              borderRadius: 2,
              height: 26,
              fontSize: "0.78rem",
            }}
          />
        </Box>
        <Stack spacing={1}>
          {paymentMilestones.map((item, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="center">
              <Typography sx={{ width: 20, color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.8rem", textAlign: "center", flexShrink: 0 }}>{i + 1}</Typography>
              <TF value={item.label} onChange={(e) => updateMilestone(i, "label", e.target.value)} />
              <TF value={item.percent} onChange={(e) => updateMilestone(i, "percent", e.target.value)} sx={{ ...inputSx, width: 90, flexShrink: 0 }} />
              <Typography sx={{ color: isDark ? "#64748b" : "#94a3b8", fontWeight: 700, flexShrink: 0 }}>%</Typography>
              <IconButton onClick={() => removeMilestone(i)} size="small" sx={{ color: "#f9735b", flexShrink: 0 }}>
                <HighlightOff fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={addMilestone}
          sx={{
            mt: 1.5,
            borderRadius: 2,
            textTransform: "none",
            borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)",
            color: isDark ? "#cbd5e1" : "#475569",
          }}
        >
          Add milestone
        </Button>
      </Block>

      <Block>
        <BlockLabel title="GST / payment note" hint="Shown below the milestones" />
        <TextField
          multiline
          minRows={2}
          fullWidth
          size="small"
          placeholder="e.g. GST is included in the quoted amount. Leave blank to use the standard GST note."
          value={form.paymentNote}
          onChange={updateField("paymentNote")}
          sx={inputSx}
        />
      </Block>
    </Stack>
  );
}

function StepSections({ sectionsToShow, toggle }) {
  return (
    <Stack spacing={0}>
      <SectionHeader icon={<VisibilityOutlined />} title="Sections to show" />
      <Block>
        <BlockLabel title="Sections to show in the quotation" hint="Turn off to hide from PDF" />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.25 }}>
          {sectionsToShow.map((item, i) => (
            <ToggleRow key={item.label} label={item.label} checked={item.enabled} onChange={() => toggle(i)} />
          ))}
        </Box>
      </Block>
    </Stack>
  );
}

function StepInstallation({ steps: isteps, update, add, remove }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const inputSx = getInputSx(isDark);

  return (
    <Stack spacing={0}>
      <SectionHeader icon={<BuildCircleOutlined />} title="Installation process" />
      <Block>
        <BlockLabel title="Installation steps" hint="Shown on the quotation" />
        <Stack spacing={1.5}>
          {isteps.map((step, i) => (
            <Paper
              key={i}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2.5,
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)",
                bgcolor: isDark ? "#0f172a" : "#fff",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 1.5,
              }}
            >
              <Stack spacing={1.25}>
                <TF value={step.title} onChange={(e) => update(i, "title", e.target.value)} label="Step title" />
                <TextField
                  multiline
                  minRows={2}
                  fullWidth
                  size="small"
                  label="Description"
                  value={step.description}
                  onChange={(e) => update(i, "description", e.target.value)}
                  sx={inputSx}
                />
              </Stack>
              <IconButton onClick={() => remove(i)} size="small" sx={{ color: "#f9735b", alignSelf: "flex-start", mt: 0.5 }}>
                <HighlightOff fontSize="small" />
              </IconButton>
            </Paper>
          ))}
        </Stack>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={add}
          sx={{
            mt: 1.5,
            borderRadius: 2,
            textTransform: "none",
            borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)",
            color: isDark ? "#cbd5e1" : "#475569",
          }}
        >
          Add step
        </Button>
      </Block>
    </Stack>
  );
}

function StepTerms({ termsGroups, updateHeading, updatePoint, addPoint, removePoint, addGroup, removeGroup }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Stack spacing={0}>
      <SectionHeader icon={<DescriptionOutlined />} title="Terms & conditions" />
      <Block>
        <BlockLabel title="Terms groups" hint="Groups of bullet points shown on the quotation" />
        <Stack spacing={2}>
          {termsGroups.map((group, gi) => (
            <Paper
              key={gi}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2.5,
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)",
                bgcolor: isDark ? "#0f172a" : "#fff",
              }}
            >
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TF value={group.heading} onChange={(e) => updateHeading(gi, e.target.value)} label="Group heading" />
                  <IconButton onClick={() => removeGroup(gi)} size="small" sx={{ color: "#f9735b", flexShrink: 0 }}>
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Stack>
                {group.points.map((pt, pi) => (
                  <Stack key={pi} direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "1.2rem", lineHeight: 1, flexShrink: 0 }}>·</Typography>
                    <TF value={pt} onChange={(e) => updatePoint(gi, pi, e.target.value)} />
                    <IconButton onClick={() => removePoint(gi, pi)} size="small" sx={{ color: "#f9735b", flexShrink: 0 }}>
                      <HighlightOff fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
                <Button
                  variant="text"
                  startIcon={<Add fontSize="small" />}
                  onClick={() => addPoint(gi)}
                  sx={{ alignSelf: "flex-start", textTransform: "none", color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.8rem" }}
                >
                  Add point
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={addGroup}
          sx={{
            mt: 1.5,
            borderRadius: 2,
            textTransform: "none",
            borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)",
            color: isDark ? "#cbd5e1" : "#475569",
          }}
        >
          Add terms group
        </Button>
      </Block>
    </Stack>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function QuotationEditor({ initialMode = null }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const sectionBg = isDark ? "#0f172a" : "#f5f7fa";

  const navigate = useNavigate();
  const location = useLocation();
  const { fetchAPI } = useAuth();
  const savedQuotation = location.state?.quotationData || loadCurrentQuotation();
  const mode = initialMode || location.state?.mode || null;
  const sourceLead = location.state?.lead || savedQuotation?.lead || null;
  const quotationTitle = savedQuotation?.quotationTitle || location.state?.quotationTitle || "test 1";
  const isCreateMode = mode === "create" || !savedQuotation?.savedAt;
  const pageTitle = isCreateMode ? "Create quotation" : "Edit quotation";
  const helperText = isCreateMode
    ? "Fill the quotation fields shown in the proposal editor"
    : "Update the quotation fields shown in the proposal editor";
  const saveLabel = isCreateMode ? "Create quotation" : "Update quotation";

  const [activeStep, setActiveStep] = useState(1);
  const [form, setForm] = useState(() => savedQuotation?.form || {
    systemSize: "2000.00", totalCost: "2000.00", structureCapacity: "",
    governmentSubsidy: subsidyOptions[0], subsidyAmount: "0", systemType: "Off-grid",
    batteryBackup: true, financeRequired: true, batteryBrand: "Luminous",
    batteryCapacity: "200", batteryType: "LFP", batteryQty: "200", batteryWarranty: "2",
    salutation: "None", customerType: "Commercial", monthlyBill: "", roofArea: "2000.00",
    wattPeak: "540", panelQty: "200", panelBrand: "Waaree Energies", panelCategory: "TopCon (N-Type)",
    inverterSize: "200.00", inverterQty: "1", phase: "Three Phase", inverterType: "String",
    inverterBrand: "Havells Solar", cableBrand: "Havells", dcCableSpec: "4 sq mm",
    acCableSpec: "As per design", structureType: "", structureSize: "120*40", structureBrand: "Apollo",
    componentItems: [],
    panelWarrantyYears: "12", inverterWarrantyYears: "7", bosWarrantyYears: "5",
    cableWarrantyYears: "1", performanceGuarantee: "", netSolarMeter: "",
    dcCablesConduits: "Reputed Make", dcdbAcdb: "Reputed Make",
    earthing: "Reputed Make — 3 Nos.", lightningArrestor: "Reputed Make — 1 No.",
    electricityTariff: "", tariffEscalation: "", panelDegradation: "",
    projectionYears: "", generationPerKw: "", paymentNote: "",
  });

  const [paymentMilestones, setPaymentMilestones] = useState(() => savedQuotation?.paymentMilestones || [
    { label: "Advance — on order confirmation", percent: "30" },
    { label: "On delivery of materials at site", percent: "50" },
    { label: "On completion of installation", percent: "10" },
    { label: "On commissioning & net meter installation", percent: "10" },
  ]);
  const [sectionsToShow, setSectionsToShow] = useState(() => savedQuotation?.sectionsToShow || sectionShowDefaults);
  const [installationSteps, setInstallationSteps] = useState(() => savedQuotation?.installationSteps || initialInstallationSteps);
  const [termsGroups, setTermsGroups] = useState(() => savedQuotation?.termsGroups || initialTermsGroups);

  const pricePerKw = useMemo(() => {
    const size = Number(form.systemSize), total = Number(form.totalCost);
    if (!size || isNaN(size) || isNaN(total)) return "₹0/kW";
    return `₹${Math.round(total / size).toLocaleString("en-IN")}/kW`;
  }, [form.systemSize, form.totalCost]);

  const paymentTotal = useMemo(
    () => paymentMilestones.reduce((sum, m) => sum + (Number(m.percent) || 0), 0),
    [paymentMilestones],
  );

  const updateField = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const updateValue = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateMilestone = (i, key, val) => setPaymentMilestones((prev) => prev.map((m, idx) => idx === i ? { ...m, [key]: val } : m));
  const addMilestone = () => setPaymentMilestones((prev) => [...prev, { label: "", percent: "0" }]);
  const removeMilestone = (i) => setPaymentMilestones((prev) => prev.filter((_, idx) => idx !== i));
  const toggleSection = (i) => setSectionsToShow((prev) => prev.map((s, idx) => idx === i ? { ...s, enabled: !s.enabled } : s));
  const updateStep = (i, key, val) => setInstallationSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s));
  const addStep = () => setInstallationSteps((prev) => [...prev, { title: `${prev.length + 1}. New step`, description: "" }]);
  const removeStep = (i) => setInstallationSteps((prev) => prev.filter((_, idx) => idx !== i));
  const updateTermsHeading = (gi, val) => setTermsGroups((prev) => prev.map((g, i) => i === gi ? { ...g, heading: val } : g));
  const updateTermsPoint = (gi, pi, val) => setTermsGroups((prev) => prev.map((g, i) => i === gi ? { ...g, points: g.points.map((p, j) => j === pi ? val : p) } : g));
  const addTermsPoint = (gi) => setTermsGroups((prev) => prev.map((g, i) => i === gi ? { ...g, points: [...g.points, ""] } : g));
  const removeTermsPoint = (gi, pi) => setTermsGroups((prev) => prev.map((g, i) => i === gi ? { ...g, points: g.points.filter((_, j) => j !== pi) } : g));
  const addTermsGroup = () => setTermsGroups((prev) => [...prev, { heading: "New group", points: [""] }]);
  const removeTermsGroup = (gi) => setTermsGroups((prev) => prev.filter((_, i) => i !== gi));

  const saveQuotation = async () => {
    const editingQuotation = mode === "edit" ? savedQuotation : null;
    let latestLead = sourceLead;
    if (sourceLead?._id) {
      try {
        const response = await fetchAPI(`/lead/getLeadById/${sourceLead._id}`);
        latestLead = response?.result || response?.lead || sourceLead;
      } catch {
        latestLead = sourceLead;
      }
    }

    const nextQuotation = buildQuotationRecord({
      existingQuotation: editingQuotation,
      lead: latestLead,
      quotationTitle,
      form,
      paymentMilestones,
      sectionsToShow,
      installationSteps,
      termsGroups,
    });

    await upsertQuotation(nextQuotation);

    if (latestLead?._id) {
      try {
        await fetchAPI(`/lead/${latestLead._id}/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "Quotation",
            title: isCreateMode ? "Quotation created" : "Quotation updated",
            message: `${nextQuotation.quotationNumber || "Quotation"} saved for ${nextQuotation.leadName || "lead"}`,
            status: nextQuotation.status || "draft",
            quotationId: nextQuotation.id,
            totalCost: nextQuotation.totalCost || nextQuotation.form?.totalCost || "",
            actionDetails: {
              quotationNumber: nextQuotation.quotationNumber,
              systemSize: nextQuotation.systemSize || nextQuotation.form?.systemSize,
              totalCost: nextQuotation.totalCost || nextQuotation.form?.totalCost,
            },
          }),
        });
      } catch (error) {
        console.warn("Failed to sync quotation activity:", error);
      }
      navigate(`/all-leads/${latestLead._id}`, {
        replace: true,
        state: {
          lead: latestLead,
          initialTab: "quotations",
          quotationId: nextQuotation.id,
          quotationUpdatedAt: nextQuotation.savedAt,
        },
      });
      return;
    }

    navigate(`/quotation?quoteId=${nextQuotation.id}`, {
      replace: true,
      state: {
        quotationId: nextQuotation.id,
        quotationUpdatedAt: nextQuotation.savedAt,
      },
    });
  };

  const renderStep = () => {
    switch (activeStep) {
      case 1: return <StepCustomer form={form} updateField={updateField} updateValue={updateValue} pricePerKw={pricePerKw} />;
      case 2: return <StepComponents form={form} updateField={updateField} updateValue={updateValue} />;
      case 3: return <StepWarranty form={form} updateField={updateField} updateValue={updateValue} />;
      case 4: return <StepFinancial form={form} updateField={updateField} />;
      case 5: return <StepPayment paymentMilestones={paymentMilestones} updateMilestone={updateMilestone} addMilestone={addMilestone} removeMilestone={removeMilestone} paymentTotal={paymentTotal} form={form} updateField={updateField} />;
      case 6: return <StepSections sectionsToShow={sectionsToShow} toggle={toggleSection} />;
      case 7: return <StepInstallation steps={installationSteps} update={updateStep} add={addStep} remove={removeStep} />;
      case 8: return <StepTerms termsGroups={termsGroups} updateHeading={updateTermsHeading} updatePoint={updateTermsPoint} addPoint={addTermsPoint} removePoint={removeTermsPoint} addGroup={addTermsGroup} removeGroup={removeTermsGroup} />;
      default: return null;
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: sectionBg, p: { xs: 1.5, md: 2.5 } }}>
      <Paper
        elevation={0}
        sx={{
          minHeight: "calc(100vh - 40px)",
          borderRadius: 4,
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "0.5px solid rgba(0,0,0,0.09)",
          overflow: "hidden",
          bgcolor: isDark ? "#1e293b" : "#fff",
        }}
      >
        {/* ── top bar ── */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: { xs: 2, md: 3 },
            py: 2,
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "0.5px solid rgba(0,0,0,0.08)",
            bgcolor: isDark ? "#1e293b" : "#fff",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                border: isDark ? "1px solid rgba(255,255,255,0.16)" : "0.5px solid rgba(0,0,0,0.16)",
                borderRadius: 2,
                color: isDark ? "#f1f5f9" : "#1f2937",
                p: 0.75,
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: isDark ? "#f8fafc" : "#1f2937" }}>
                {pageTitle} - <Box component="span" sx={{ color: isDark ? "#60a5fa" : BRAND }}>{quotationTitle}</Box>
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#6b7280" }}>
                {helperText}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)",
                color: isDark ? "#cbd5e1" : "#475569",
                fontSize: "0.85rem",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<CheckCircleOutline fontSize="small" />}
              onClick={saveQuotation}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                bgcolor: isDark ? "#2563eb" : BRAND,
                boxShadow: "none",
                fontSize: "0.85rem",
                "&:hover": { bgcolor: "#1d4ed8", boxShadow: "none" },
              }}
            >
              {saveLabel}
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ display: "flex", minHeight: "calc(100vh - 72px)", flexDirection: { xs: "column", md: "row" } }}>
          {/* ── sidebar ── */}
          <Box
            sx={{
              width: { xs: "100%", md: 230 },
              borderRight: { xs: "none", md: isDark ? "1px solid rgba(255,255,255,0.08)" : "0.5px solid rgba(0,0,0,0.08)" },
              borderBottom: { xs: isDark ? "1px solid rgba(255,255,255,0.08)" : "0.5px solid rgba(0,0,0,0.08)", md: "none" },
              p: { xs: 1.5, md: 2 },
              bgcolor: isDark ? "#1e293b" : "#fff",
              flexShrink: 0,
            }}
          >
            <Stack spacing={0.5}>
              {steps.map((step) => {
                const active = step.id === activeStep;
                return (
                  <Button
                    key={step.id}
                    fullWidth
                    variant="text"
                    onClick={() => setActiveStep(step.id)}
                    startIcon={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            flexShrink: 0,
                            bgcolor: active
                              ? (isDark ? "#3b82f6" : BRAND)
                              : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"),
                            color: active ? "#fff" : (isDark ? "#94a3b8" : "#64748b"),
                            transition: "all .15s",
                          }}
                        >
                          {step.id}
                        </Box>
                        <Box sx={{ color: active ? (isDark ? "#60a5fa" : BRAND) : (isDark ? "#64748b" : "#94a3b8"), display: "flex", alignItems: "center" }}>
                          {step.icon}
                        </Box>
                      </Stack>
                    }
                    sx={{
                      justifyContent: "flex-start",
                      textTransform: "none",
                      py: 1.25,
                      px: 1.5,
                      borderRadius: 2.5,
                      bgcolor: active
                        ? (isDark ? "rgba(59,130,246,0.2)" : BRAND_LIGHT)
                        : "transparent",
                      color: active
                        ? (isDark ? "#93c5fd" : BRAND_TEXT)
                        : (isDark ? "#94a3b8" : "#64748b"),
                      fontSize: "0.825rem",
                      fontWeight: active ? 700 : 500,
                      "& .MuiButton-startIcon": { mr: 1 },
                      "&:hover": {
                        bgcolor: active
                          ? (isDark ? "rgba(59,130,246,0.25)" : "#dfe9ff")
                          : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"),
                      },
                      transition: "all .15s",
                    }}
                  >
                    {step.label}
                  </Button>
                );
              })}
            </Stack>
          </Box>

          {/* ── main content ── */}
          <Box sx={{ flex: 1, p: { xs: 2, md: 3.5 }, bgcolor: sectionBg, overflowY: "auto" }}>
            {renderStep()}
            <FooterActions onCancel={() => navigate(-1)} onSave={saveQuotation} saveLabel={saveLabel} />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
