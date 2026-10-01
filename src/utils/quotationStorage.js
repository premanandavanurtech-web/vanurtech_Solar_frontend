import axiosInstance from "./axiosConfig";

export const CURRENT_QUOTATION_STORAGE_KEY = "solar360-current-quotation";
export const QUOTATION_LIBRARY_STORAGE_KEY = "solar360-quotations";

const QUOTATION_VALIDITY_DAYS = 14;

const parseStoredValue = (rawValue, fallbackValue) => {
  try {
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const readStorage = (key, fallbackValue) => {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return parseStoredValue(val, fallbackValue);
    const legacyKey = key.replace(/^solar360-/, "solar-crm-");
    if (legacyKey !== key) {
      const legacyVal = localStorage.getItem(legacyKey);
      if (legacyVal !== null) return parseStoredValue(legacyVal, fallbackValue);
    }
    return fallbackValue;
  } catch {
    return fallbackValue;
  }
};

const writeStorage = (key, value) => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures to avoid blocking the quotation flow.
  }
};

const toFiniteNumber = (value) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : 0;
};

const getQuotationLeadId = (quotation) =>
  quotation?.leadId || quotation?.lead?._id || "";

const getQuotationSequenceForYear = (quotations, year) =>
  quotations.reduce((highestValue, quotation) => {
    const quotationNumber = String(quotation?.quotationNumber || "");
    const match = quotationNumber.match(/^QT-(\d{4})\/(\d{4})$/);
    if (!match || match[2] !== String(year)) return highestValue;
    return Math.max(highestValue, Number(match[1]));
  }, 0);

const createQuotationId = () =>
  `quotation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createShareToken = () =>
  Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14);

const resolveLeadName = (lead, fallbackTitle) => {
  if (!lead) return fallbackTitle || "Quotation";
  return (
    lead.customerName ||
    lead.name ||
    lead.fullName ||
    [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim() ||
    fallbackTitle ||
    "Quotation"
  );
};

export const loadCurrentQuotation = () =>
  readStorage(CURRENT_QUOTATION_STORAGE_KEY, null);

export const setCurrentQuotation = (quotation) => {
  writeStorage(CURRENT_QUOTATION_STORAGE_KEY, quotation || null);
};

export const loadQuotationLibrary = () => {
  const stored = readStorage(QUOTATION_LIBRARY_STORAGE_KEY, []);
  return Array.isArray(stored) ? stored : [];
};

export const findQuotationById = (quotationId) => {
  if (!quotationId) return null;
  return (
    loadQuotationLibrary().find(
      (quotation) =>
        quotation.id === quotationId ||
        quotation._id === quotationId ||
        quotation.quotationNumber === quotationId
    ) || null
  );
};

export const fetchQuotationByIdFromServer = async (quotationId) => {
  try {
    if (!quotationId) return null;
    const res = await axiosInstance.get(`/quotation/${encodeURIComponent(quotationId)}`);
    const data = res?.data?.result || res?.data?.data || null;
    if (data) {
      const current = loadQuotationLibrary();
      const updated = [
        data,
        ...current.filter(
          (q) =>
            q.id !== data.id &&
            (!data._id || q._id !== data._id) &&
            q.quotationNumber !== data.quotationNumber
        ),
      ];
      writeStorage(QUOTATION_LIBRARY_STORAGE_KEY, updated);
      return data;
    }
    return null;
  } catch (err) {
    console.warn("Failed to fetch quotation from server by id:", err);
    return null;
  }
};

export const findQuotationByShareToken = (shareToken) =>
  loadQuotationLibrary().find((quotation) => quotation.shareToken === shareToken) || null;

export const getQuotationsForLead = (leadId) =>
  loadQuotationLibrary().filter((quotation) => getQuotationLeadId(quotation) === leadId);

export const buildQuotationRecord = ({
  existingQuotation = null,
  lead = null,
  quotationTitle = "",
  form = {},
  paymentMilestones = [],
  sectionsToShow = [],
  installationSteps = [],
  termsGroups = [],
}) => {
  const quotations = loadQuotationLibrary();
  const now = new Date().toISOString();
  const createdAt = existingQuotation?.createdAt || existingQuotation?.savedAt || now;
  const issueDate = new Date(createdAt);
  const quotationYear = Number.isNaN(issueDate.getTime()) ? new Date().getFullYear() : issueDate.getFullYear();
  const nextSequence = getQuotationSequenceForYear(quotations, quotationYear) + 1;
  const leadName = resolveLeadName(lead || existingQuotation?.lead, quotationTitle);

  return {
    ...existingQuotation,
    id: existingQuotation?.id || createQuotationId(),
    quotationNumber:
      existingQuotation?.quotationNumber ||
      `QT-${String(nextSequence).padStart(4, "0")}/${quotationYear}`,
    quotationTitle: quotationTitle || existingQuotation?.quotationTitle || leadName,
    lead: lead || existingQuotation?.lead || null,
    leadId: lead?._id || existingQuotation?.leadId || existingQuotation?.lead?._id || "",
    leadName,
    form,
    paymentMilestones,
    sectionsToShow,
    installationSteps,
    termsGroups,
    totalCost: toFiniteNumber(form?.totalCost),
    systemSize: toFiniteNumber(form?.systemSize),
    status: existingQuotation?.status || "draft",
    validityDays: existingQuotation?.validityDays || QUOTATION_VALIDITY_DAYS,
    createdAt,
    savedAt: now,
  };
};

export const fetchQuotationsFromServer = async (leadId = null) => {
  try {
    const params = leadId ? { leadId } : {};
    const response = await axiosInstance.get("/quotation", { params });
    const serverList = response?.data?.result || response?.data?.data || [];
    if (Array.isArray(serverList)) {
      const localList = loadQuotationLibrary();
      let merged = [];
      if (leadId) {
        const otherLeads = localList.filter(
          (item) => item.leadId !== leadId && item.lead?._id !== leadId && item.lead?.id !== leadId
        );
        merged = [...serverList, ...otherLeads].sort(
          (a, b) => new Date(b.savedAt || b.createdAt || 0) - new Date(a.savedAt || a.createdAt || 0)
        );
      } else {
        merged = serverList.sort(
          (a, b) => new Date(b.savedAt || b.createdAt || 0) - new Date(a.savedAt || a.createdAt || 0)
        );
      }
      writeStorage(QUOTATION_LIBRARY_STORAGE_KEY, merged);
      return merged;
    }
    return loadQuotationLibrary();
  } catch (error) {
    console.warn("Failed to fetch quotations from backend:", error);
    return loadQuotationLibrary();
  }
};

export const upsertQuotation = async (quotation) => {
  const currentQuotations = loadQuotationLibrary();
  const nextQuotations = [quotation, ...currentQuotations.filter((entry) => entry.id !== quotation.id)].sort(
    (leftEntry, rightEntry) => new Date(rightEntry.savedAt || 0) - new Date(leftEntry.savedAt || 0),
  );

  writeStorage(QUOTATION_LIBRARY_STORAGE_KEY, nextQuotations);
  setCurrentQuotation(quotation);

  // Sync to backend and await confirmation
  try {
    const res = await axiosInstance.post("/quotation", quotation);
    if (res?.data?.result) {
      const serverQuotation = res.data.result;
      const updatedList = [
        serverQuotation,
        ...nextQuotations.filter((q) => q.id !== quotation.id && q.id !== serverQuotation.id),
      ];
      writeStorage(QUOTATION_LIBRARY_STORAGE_KEY, updatedList);
      return updatedList;
    }
  } catch (err) {
    console.warn("Failed to sync quotation to server:", err);
  }

  return nextQuotations;
};

export const updateQuotationStatus = (quotationId, status) => {
  const currentQuotations = loadQuotationLibrary();
  const nextQuotations = currentQuotations.map((quotation) => {
    if (quotation.id !== quotationId && quotation._id !== quotationId && quotation.quotationNumber !== quotationId) {
      return quotation;
    }

    const now = new Date().toISOString();
    return {
      ...quotation,
      status,
      savedAt: now,
      sentAt: status === "sent" ? quotation.sentAt || now : quotation.sentAt,
      acceptedAt: status === "accepted" ? quotation.acceptedAt || now : quotation.acceptedAt,
    };
  }).sort((leftEntry, rightEntry) => new Date(rightEntry.savedAt || 0) - new Date(leftEntry.savedAt || 0));

  writeStorage(QUOTATION_LIBRARY_STORAGE_KEY, nextQuotations);

  const activeQuotation = loadCurrentQuotation();
  if (activeQuotation?.id === quotationId || activeQuotation?._id === quotationId || activeQuotation?.quotationNumber === quotationId) {
    setCurrentQuotation(nextQuotations.find((quotation) => quotation.id === quotationId || quotation._id === quotationId || quotation.quotationNumber === quotationId) || null);
  }

  // Sync status to backend
  axiosInstance.patch(`/quotation/${encodeURIComponent(quotationId)}/status`, { status }).catch((err) => {
    console.warn("Failed to sync quotation status to server:", err);
  });

  return nextQuotations;
};

export const deleteQuotation = async (quotationId) => {
  const currentList = loadQuotationLibrary();
  const target = currentList.find(
    (q) => q.id === quotationId || q._id === quotationId || q.quotationNumber === quotationId
  );
  const nextQuotations = currentList.filter(
    (quotation) =>
      quotation.id !== quotationId &&
      quotation._id !== quotationId &&
      quotation.quotationNumber !== quotationId &&
      (!target || (quotation.id !== target.id && (!target._id || quotation._id !== target._id)))
  );
  writeStorage(QUOTATION_LIBRARY_STORAGE_KEY, nextQuotations);

  const activeQuotation = loadCurrentQuotation();
  if (
    activeQuotation?.id === quotationId ||
    activeQuotation?._id === quotationId ||
    activeQuotation?.quotationNumber === quotationId ||
    (target && (activeQuotation?.id === target.id || activeQuotation?._id === target._id))
  ) {
    setCurrentQuotation(null);
  }

  // Delete from backend using target._id, target.id, or quotationId
  try {
    const idToDelete = target?._id || target?.id || quotationId;
    await axiosInstance.delete(`/quotation/${encodeURIComponent(idToDelete)}`);
  } catch (err) {
    console.warn("Failed to sync quotation deletion to server:", err);
  }

  return nextQuotations;
};

export const ensureQuotationShareToken = (quotationId) => {
  let resolvedQuotation = null;

  const nextQuotations = loadQuotationLibrary().map((quotation) => {
    if (quotation.id !== quotationId) return quotation;

    resolvedQuotation = quotation.shareToken
      ? quotation
      : {
          ...quotation,
          shareToken: createShareToken(),
          shareEnabledAt: new Date().toISOString(),
        };

    return resolvedQuotation;
  });

  if (!resolvedQuotation) return null;

  writeStorage(QUOTATION_LIBRARY_STORAGE_KEY, nextQuotations);

  const activeQuotation = loadCurrentQuotation();
  if (activeQuotation?.id === quotationId) {
    setCurrentQuotation(resolvedQuotation);
  }

  return resolvedQuotation;
};
