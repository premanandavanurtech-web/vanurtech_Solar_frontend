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

export const findQuotationById = (quotationId) =>
  loadQuotationLibrary().find((quotation) => quotation.id === quotationId) || null;

export const findQuotationByShareToken = (shareToken) =>
  loadQuotationLibrary().find((quotation) => quotation.shareToken === shareToken) || null;

export const getQuotationsForLead = (leadId) =>
  loadQuotationLibrary().filter((quotation) => getQuotationLeadId(quotation) === leadId);

export const getAcceptedOrLatestQuotation = (leadId) => {
  const list = getQuotationsForLead(leadId);
  if (!list.length) return null;
  return list.find((q) => q.status === "accepted") || list[0];
};

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

export const upsertQuotation = (quotation) => {
  const currentQuotations = loadQuotationLibrary();
  const nextQuotations = [quotation, ...currentQuotations.filter((entry) => entry.id !== quotation.id)].sort(
    (leftEntry, rightEntry) => new Date(rightEntry.savedAt || 0) - new Date(leftEntry.savedAt || 0),
  );

  writeStorage(QUOTATION_LIBRARY_STORAGE_KEY, nextQuotations);
  setCurrentQuotation(quotation);
  return nextQuotations;
};

export const updateQuotationStatus = (quotationId, status) => {
  const currentQuotations = loadQuotationLibrary();
  const targetQuotation = currentQuotations.find((q) => q.id === quotationId);
  const targetLeadId = targetQuotation ? getQuotationLeadId(targetQuotation) : null;

  const nextQuotations = currentQuotations.map((quotation) => {
    if (quotation.id === quotationId) {
      const now = new Date().toISOString();
      return {
        ...quotation,
        status,
        savedAt: now,
        sentAt: status === "sent" ? quotation.sentAt || now : quotation.sentAt,
        acceptedAt: status === "accepted" ? quotation.acceptedAt || now : quotation.acceptedAt,
      };
    }

    if (
      status === "accepted" &&
      targetLeadId &&
      getQuotationLeadId(quotation) === targetLeadId &&
      quotation.status === "accepted"
    ) {
      return {
        ...quotation,
        status: "sent",
      };
    }

    return quotation;
  }).sort((leftEntry, rightEntry) => new Date(rightEntry.savedAt || 0) - new Date(leftEntry.savedAt || 0));

  writeStorage(QUOTATION_LIBRARY_STORAGE_KEY, nextQuotations);

  const activeQuotation = loadCurrentQuotation();
  if (activeQuotation?.id === quotationId) {
    setCurrentQuotation(nextQuotations.find((quotation) => quotation.id === quotationId) || null);
  }

  return nextQuotations;
};

export const deleteQuotation = (quotationId) => {
  const nextQuotations = loadQuotationLibrary().filter((quotation) => quotation.id !== quotationId);
  writeStorage(QUOTATION_LIBRARY_STORAGE_KEY, nextQuotations);

  const activeQuotation = loadCurrentQuotation();
  if (activeQuotation?.id === quotationId) {
    setCurrentQuotation(null);
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
