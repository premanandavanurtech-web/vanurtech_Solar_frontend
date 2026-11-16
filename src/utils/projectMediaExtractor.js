import { toBackendAssetUrl } from "./backendAssetUrl";

const IMAGE_DOCUMENT_REGEX = /\.(jpe?g|png|webp|gif|bmp|svg)(\?.*)?$/i;
const PDF_DOCUMENT_REGEX = /\.pdf(\?.*)?$/i;
const CLOUDINARY_IMAGE_REGEX = /res\.cloudinary\.com\/.+\/image\/upload\//i;
const CLOUDINARY_PDF_REGEX = /res\.cloudinary\.com\/.+\/(?:image|raw)\/upload\/.+\.pdf/i;

export const isImageMediaUrl = (url = "", name = "") => {
  if (!url && !name) return false;
  const combined = `${url} ${name}`;
  if (isPdfMediaUrl(url, name)) return false;
  return IMAGE_DOCUMENT_REGEX.test(combined) || CLOUDINARY_IMAGE_REGEX.test(url);
};

export const isPdfMediaUrl = (url = "", name = "") => {
  if (!url && !name) return false;
  const combined = `${url} ${name}`;
  return PDF_DOCUMENT_REGEX.test(combined) || CLOUDINARY_PDF_REGEX.test(url);
};

export const getMediaFileNameFromUrl = (url = "") => {
  if (!url) return "";
  try {
    return decodeURIComponent(url.split("?")[0].split("/").pop() || "");
  } catch {
    return url.split("?")[0].split("/").pop() || "";
  }
};

/**
 * Extracts and unifies ALL images and documents uploaded throughout the project lifecycle.
 * Pulls from Registration, Customer KYC Documents, Site Survey & Visits, Installation,
 * DCR Generation, Demand Note Payment, Inspection, Meter Installation, Commissioning,
 * and direct gallery uploads.
 *
 * @param {Object} project - The lead / project document
 * @returns {Array} List of unified media items with type, stage, preview, and category
 */
export const extractAllProjectMedia = (project) => {
  if (!project || typeof project !== "object") return [];

  const mediaList = [];
  const seenUrls = new Set();

  const addMediaItem = ({
    id,
    name,
    url,
    category = "Project Documents",
    stage = "Project Completion",
    stageKey = "",
    uploadedAt,
    caption = "",
    status = "uploaded",
    source = "",
    canDelete = false,
  }) => {
    if (!url || typeof url !== "string") return;
    const cleanUrl = url.trim();
    if (!cleanUrl || seenUrls.has(cleanUrl)) return;
    seenUrls.add(cleanUrl);

    const fileName = name || getMediaFileNameFromUrl(cleanUrl) || "Document";
    const isImg = isImageMediaUrl(cleanUrl, fileName);
    const isPdf = isPdfMediaUrl(cleanUrl, fileName);

    mediaList.push({
      id: id || `${source}_${mediaList.length}_${cleanUrl}`,
      _id: id || `${source}_${mediaList.length}`,
      name: fileName,
      fileName,
      url: cleanUrl,
      previewUrl: toBackendAssetUrl(cleanUrl),
      category,
      stage,
      stageKey,
      caption: caption || "",
      uploadedAt: uploadedAt || project.updatedAt || project.createdAt || new Date(),
      isImage: isImg,
      isPdf: isPdf,
      status: status || "uploaded",
      source,
      canDelete: Boolean(canDelete),
    });
  };

  // 1. Project Images Gallery (manually uploaded via Photos modal)
  if (Array.isArray(project.projectImages)) {
    project.projectImages.forEach((img, idx) => {
      if (img?.url) {
        addMediaItem({
          id: img._id || `gallery_${idx}`,
          name: img.name || img.caption || `Project Photo ${idx + 1}`,
          url: img.url,
          category: img.category || "Photos Gallery",
          stage: "Photos Gallery",
          stageKey: "project_images",
          uploadedAt: img.uploadedAt,
          caption: img.caption || "",
          source: "projectImages",
          canDelete: true,
        });
      }
    });
  }

  // 2. Stage 2: Registration Document
  if (project.uploadDocument?.url) {
    addMediaItem({
      name: project.uploadDocument.name || "Registration Document",
      url: project.uploadDocument.url,
      category: "Registration & DISCOM",
      stage: "Stage 02: Registration",
      stageKey: "registration",
      uploadedAt: project.uploadDocument.uploadedAt || project.dateOfRegistration,
      status: project.uploadDocument.status || "verified",
      source: "uploadDocument",
    });
  }

  // 3. Stage 3: KYC & Identity Documents
  if (project.aadhaar?.url) {
    addMediaItem({
      name: project.aadhaar.name || "Aadhaar Card",
      url: project.aadhaar.url,
      category: "Customer KYC",
      stage: "Stage 03: Documents",
      stageKey: "document",
      uploadedAt: project.aadhaar.uploadedAt || project.documentSubmissionDate,
      status: project.aadhaar.status || "verified",
      source: "aadhaar",
    });
  }

  if (project.panCard?.url) {
    addMediaItem({
      name: project.panCard.name || "PAN Card",
      url: project.panCard.url,
      category: "Customer KYC",
      stage: "Stage 03: Documents",
      stageKey: "document",
      uploadedAt: project.panCard.uploadedAt || project.documentSubmissionDate,
      status: project.panCard.status || "verified",
      source: "panCard",
    });
  }

  if (project.passbook?.url) {
    addMediaItem({
      name: project.passbook.name || "Bank Passbook / Statement",
      url: project.passbook.url,
      category: "Customer KYC",
      stage: "Stage 03: Documents",
      stageKey: "document",
      uploadedAt: project.passbook.uploadedAt || project.documentSubmissionDate,
      status: project.passbook.status || "verified",
      source: "passbook",
    });
  }

  if (project.electricityBill?.url) {
    addMediaItem({
      name: project.electricityBill.name || "Electricity Bill",
      url: project.electricityBill.url,
      category: "Project Documents",
      stage: "Stage 03: Documents",
      stageKey: "document",
      uploadedAt: project.electricityBill.uploadedAt || project.documentSubmissionDate,
      status: project.electricityBill.status || "verified",
      source: "electricityBill",
    });
  }

  if (Array.isArray(project.otherDocuments)) {
    project.otherDocuments.forEach((doc, idx) => {
      if (doc?.url) {
        addMediaItem({
          id: doc._id || `other_${idx}`,
          name: doc.name || getMediaFileNameFromUrl(doc.url) || `Other Document ${idx + 1}`,
          url: doc.url,
          category: "Project Documents",
          stage: "Stage 03: Documents",
          stageKey: "document",
          uploadedAt: doc.uploadedAt || project.documentSubmissionDate,
          status: doc.status || "verified",
          source: "otherDocuments",
        });
      }
    });
  }

  // 4. Site Survey & Site Visits
  const siteSurvey = project.siteSurvey;
  if (siteSurvey && typeof siteSurvey === "object") {
    const surveyPhotos = Array.isArray(siteSurvey.photos) ? siteSurvey.photos : [];
    surveyPhotos.forEach((photo, idx) => {
      const pUrl = typeof photo === "string" ? photo : (photo?.url || photo?.uri);
      if (pUrl) {
        addMediaItem({
          id: photo?._id || `survey_${idx}`,
          name: photo?.name || photo?.caption || `Site Survey Photo ${idx + 1}`,
          url: pUrl,
          category: "Site Survey",
          stage: "Site Survey",
          stageKey: "site_survey",
          uploadedAt: photo?.uploadedAt || siteSurvey.savedAt,
          source: "siteSurvey.photos",
        });
      }
    });

    const surveyImages = Array.isArray(siteSurvey.images) ? siteSurvey.images : [];
    surveyImages.forEach((img, idx) => {
      const pUrl = typeof img === "string" ? img : (img?.url || img?.uri);
      if (pUrl) {
        addMediaItem({
          id: img?._id || `survey_img_${idx}`,
          name: img?.name || `Site Survey Image ${idx + 1}`,
          url: pUrl,
          category: "Site Survey",
          stage: "Site Survey",
          stageKey: "site_survey",
          uploadedAt: img?.uploadedAt || siteSurvey.savedAt,
          source: "siteSurvey.images",
        });
      }
    });
  }

  if (Array.isArray(project.siteSurveyPhotos)) {
    project.siteSurveyPhotos.forEach((p, idx) => {
      const pUrl = typeof p === "string" ? p : p?.url;
      if (pUrl) {
        addMediaItem({
          id: p?._id || `site_survey_photo_${idx}`,
          name: p?.name || `Site Survey Photo ${idx + 1}`,
          url: pUrl,
          category: "Site Survey",
          stage: "Site Survey",
          stageKey: "site_survey",
          uploadedAt: p?.uploadedAt,
          source: "siteSurveyPhotos",
        });
      }
    });
  }

  if (Array.isArray(project.siteVisits)) {
    project.siteVisits.forEach((visit, vIdx) => {
      const vPhotos = Array.isArray(visit.photos) ? visit.photos : (Array.isArray(visit.images) ? visit.images : []);
      vPhotos.forEach((p, pIdx) => {
        const pUrl = typeof p === "string" ? p : (p?.url || p?.uri);
        if (pUrl) {
          addMediaItem({
            id: p?._id || `visit_${vIdx}_photo_${pIdx}`,
            name: p?.name || `${visit.title || "Site Visit"} Photo ${pIdx + 1}`,
            url: pUrl,
            category: "Site Survey",
            stage: "Site Visit",
            stageKey: "site_visit",
            uploadedAt: p?.uploadedAt || visit.visitDate || visit.createdAt,
            source: "siteVisits",
          });
        }
      });
    });
  }

  // 5. Stage 7: Installation Photos & Document
  if (Array.isArray(project.installationPhotos)) {
    project.installationPhotos.forEach((item, idx) => {
      const pUrl = typeof item === "string" ? item : item?.url;
      if (pUrl) {
        addMediaItem({
          id: item?._id || `inst_photo_${idx}`,
          name: item?.name || `Installation Photo ${idx + 1}`,
          url: pUrl,
          category: "Rooftop & Installation",
          stage: "Stage 07: Installation",
          stageKey: "installation",
          uploadedAt: item?.uploadedAt || project.installationDate,
          source: "installationPhotos",
        });
      }
    });
  }

  if (project.installationDocument?.url) {
    addMediaItem({
      name: project.installationDocument.name || "Installation Report",
      url: project.installationDocument.url,
      category: "Rooftop & Installation",
      stage: "Stage 07: Installation",
      stageKey: "installation",
      uploadedAt: project.installationDocument.uploadedAt || project.installationDate,
      source: "installationDocument",
    });
  }

  // 6. Stage 8: DCR Generation Certificate
  if (project.dcrCertificate?.url) {
    addMediaItem({
      name: project.dcrCertificate.name || "DCR Certificate",
      url: project.dcrCertificate.url,
      category: "DCR & Approvals",
      stage: "Stage 08: DCR Generation",
      stageKey: "dcr_generation",
      uploadedAt: project.dcrCertificate.uploadedAt || project.dcrDate,
      source: "dcrCertificate",
    });
  }

  // 7. Stage 11: Demand Note Payment Receipt
  if (project.demandNotePaymentReceipt?.url) {
    addMediaItem({
      name: project.demandNotePaymentReceipt.name || "Demand Note Payment Receipt",
      url: project.demandNotePaymentReceipt.url,
      category: "Financial & Receipts",
      stage: "Stage 11: Demand Note Payment",
      stageKey: "demand_note_payment",
      uploadedAt: project.demandNotePaymentReceipt.uploadedAt || project.demandNotePaymentDate,
      source: "demandNotePaymentReceipt",
    });
  }

  // 8. Stage 12: Inspection Document
  if (project.inspectionDocument?.url) {
    addMediaItem({
      name: project.inspectionDocument.name || "Inspection Report / Document",
      category: "Inspection & Approvals",
      url: project.inspectionDocument.url,
      stage: "Stage 12: Inspection",
      stageKey: "inspection",
      uploadedAt: project.inspectionDocument.uploadedAt || project.inspectionDate,
      source: "inspectionDocument",
    });
  }

  // 9. Stage 13: Meter Photograph & Meter Installation Report
  if (project.meterPhotograph?.url) {
    addMediaItem({
      name: project.meterPhotograph.name || "Meter Photograph",
      url: project.meterPhotograph.url,
      category: "Net Meter & DISCOM",
      stage: "Stage 13: Meter Installation",
      stageKey: "meter_installation",
      uploadedAt: project.meterPhotograph.uploadedAt || project.meterInstallationDate,
      source: "meterPhotograph",
    });
  }

  if (project.meterInstallationReport?.url) {
    addMediaItem({
      name: project.meterInstallationReport.name || "Meter Installation Report",
      url: project.meterInstallationReport.url,
      category: "Net Meter & DISCOM",
      stage: "Stage 13: Meter Installation",
      stageKey: "meter_installation",
      uploadedAt: project.meterInstallationReport.uploadedAt || project.meterInstallationDate,
      source: "meterInstallationReport",
    });
  }

  // 10. Additional Completion Documents (Disbursement, Commissioning, Subsidy)
  if (project.commissioningDocument?.url || project.projectCommissioningDocument?.url) {
    const doc = project.commissioningDocument || project.projectCommissioningDocument;
    addMediaItem({
      name: doc.name || "Project Commissioning Document",
      url: doc.url,
      category: "Commissioning & Handover",
      stage: "Stage 16: Commissioning",
      stageKey: "project_commissioning",
      uploadedAt: doc.uploadedAt || project.projectCommissioningDate,
      source: "commissioningDocument",
    });
  }

  if (project.discomApprovalDocument?.url || project.discomApprovalLetter?.url) {
    const doc = project.discomApprovalDocument || project.discomApprovalLetter;
    addMediaItem({
      name: doc.name || "DISCOM Approval Letter",
      url: doc.url,
      category: "DCR & Approvals",
      stage: "Stage 17: DISCOM Approval",
      stageKey: "discom_approval",
      uploadedAt: doc.uploadedAt || project.discomApprovalDate,
      source: "discomApprovalDocument",
    });
  }

  if (project.subsidyReceipt?.url || project.subsidyDocument?.url) {
    const doc = project.subsidyReceipt || project.subsidyDocument;
    addMediaItem({
      name: doc.name || "Subsidy Receipt / Confirmation",
      url: doc.url,
      category: "Financial & Receipts",
      stage: "Stage 18: Subsidy",
      stageKey: "subsidy_redeemed",
      uploadedAt: doc.uploadedAt || project.subsidyReceivedDate || project.subsidyRedeemedDate,
      source: "subsidyReceipt",
    });
  }

  // Generic fallback: check project.photos array if present
  if (Array.isArray(project.photos)) {
    project.photos.forEach((p, idx) => {
      const pUrl = typeof p === "string" ? p : p?.url;
      if (pUrl) {
        addMediaItem({
          id: p?._id || `project_photo_${idx}`,
          name: p?.name || `Project Photo ${idx + 1}`,
          url: pUrl,
          category: "Photos Gallery",
          stage: "Project Photos",
          stageKey: "photos",
          uploadedAt: p?.uploadedAt,
          source: "photos",
        });
      }
    });
  }

  // Sort by date: most recent first
  return mediaList.sort((a, b) => {
    const tA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
    const tB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
    return tB - tA;
  });
};
