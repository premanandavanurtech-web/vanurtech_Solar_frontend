const isDocumentVerified = (status, project = {}) => {
  const s = String(status || "").toLowerCase();
  const hasDocs = Boolean(
    project.uploadDocument?.url ||
    project.aadhaar?.url ||
    project.panCard?.url ||
    project.passbook?.url ||
    (Array.isArray(project.otherDocuments) && project.otherDocuments.length > 0)
  );
  return ["submitted", "approved", "completed", "verified"].includes(s) || hasDocs;
};

export const getProjectStage = (project = {}) => {
  if (!project) return "lead_converted";

  const isBankLoanType = !project.paymentType || project.paymentType === "Bank Loan";

  // If explicit final stage is in projectStage/currentStage (and not the initial lead_converted placeholder)
  const directStage = String(project.currentStage || project.projectStage || "").toLowerCase();
  if (directStage && directStage !== "lead_converted" && directStage !== "visit") {
    if ([
      "ready_handover", "handover",
      "subsidy_received", "subsidy_redeemed", "discom_approval", "project_commissioning",
      "final_payment", "phase2_disbursement", "meter_installation", "inspection",
      "demand_note_payment", "demand_note", "notification_email", "dcr_generation",
      "installation", "disbursement", "loan_pending", "payment", "document", "registration"
    ].includes(directStage)) {
      if (directStage === "loan_pending" && !isBankLoanType) return "disbursement";
      if (directStage === "ready_handover" || directStage === "handover") return "handover";
      return directStage;
    }
  }

  const inst = String(project.installationStatus || "").toLowerCase();
  const leadStatus = String(project.status || "").toLowerCase().trim();
  const registrationStatus = String(project.registrationStatus || "").toLowerCase();
  const bankPendingStatus = String(project.bankAtPendingStatus || "").toLowerCase();
  const disbursementStatus = String(project.disbursementStatus || "").toLowerCase();
  const loanStatus = String(project.loanStatus || "").toLowerCase();
  const paymentStatus = String(project.paymentStatus || "").toLowerCase();

  const isInstallationCompleted =
    inst === "installation_completed" ||
    inst === "completed installation" ||
    inst === "completed_installation";
  const isInstallationActive = [
    "final_payment",
    "meter_charge",
    "jee_verified",
    "sent_for_jee_verification",
    "installation_progress",
    "load_enhancement",
    "pending installation",
    "completed installation",
    "pending_installation",
    "completed_installation",
  ].includes(inst) || Boolean(project.installationDate) || Boolean(project.installationPartner);

  const isDisbursementDone = disbursementStatus === "completed" || leadStatus === "disbursement";
  const isDisbursementActive = disbursementStatus === "pending" && (isInstallationCompleted || isInstallationActive);

  // ── Step 1: Handover / Ready Handover ──
  if (leadStatus === "handover" || leadStatus === "ready_handover" || leadStatus === "ready handover") {
    return "handover";
  }

  // ── Stages 15 - 19 ──
  if (leadStatus === "subsidy received" || project.subsidyReceivedStatus === "Yes" || Boolean(project.subsidyReceivedAmount)) {
    return "subsidy_received";
  }
  if (leadStatus === "subsidy redeemed" || project.subsidyRedeemedStatus === "Yes") {
    return "subsidy_redeemed";
  }
  if (leadStatus === "discom approval" || project.discomApprovalStatus === "Yes") {
    return "discom_approval";
  }
  if (leadStatus === "project commissioning" || project.projectCommissioningStatus === "Yes") {
    return "project_commissioning";
  }
  if (leadStatus === "final payment" || project.duePaymentCleared === "Yes") {
    return "final_payment";
  }

  // ── Stages 8 - 14 ──
  if (leadStatus === "phase 2 disbursement" || project.phase2DisbursementPaid === "Yes" || Boolean(project.phase2DisbursementAmount)) {
    return "phase2_disbursement";
  }
  if (leadStatus === "meter installation" || project.meterInstallationComplete === "Yes" || Boolean(project.meterInstallationDate)) {
    return "meter_installation";
  }
  if (leadStatus === "inspection" || ["By RESCO", "By Solar Coordinator", "By DISCOM"].includes(project.inspectionStatus) || Boolean(project.inspectionDocument?.url)) {
    return "inspection";
  }
  if (leadStatus === "demand note payment" || project.demandNotePaymentPaid === "Yes" || Boolean(project.demandNotePaymentAmount)) {
    return "demand_note_payment";
  }
  if (leadStatus === "demand note" || project.demandNoteGenerated === "Yes" || Boolean(project.demandNoteNumber)) {
    return "demand_note";
  }
  if (leadStatus === "notification email" || project.notificationEmailSent === "Yes" || Boolean(project.notificationNumber)) {
    return "notification_email";
  }
  if (leadStatus === "dcr generation" || project.dcrGenerated === "Yes" || Boolean(project.dcrCertificate?.url)) {
    return "dcr_generation";
  }

  // ── Step 2: Disbursement (Phase 1 Disbursement) ──
  if (isDisbursementDone || isDisbursementActive || leadStatus === "disbursement") {
    return "disbursement";
  }

  // ── Step 3: Installation ──
  if (leadStatus === "installation completion" || leadStatus === "installation" || isInstallationActive) {
    if (
      leadStatus === "installation completion" ||
      leadStatus === "installation" ||
      inst !== "installation_progress" ||
      project.installationDate ||
      project.installationDocument?.url
    ) {
      return "installation";
    }
  }

  // ── Step 4: Loan Pending / Bank at Pending (ONLY for Bank Loan) ──
  if (
    isBankLoanType &&
    (leadStatus === "bank at pending" ||
      leadStatus === "loan pending" ||
      (bankPendingStatus && bankPendingStatus !== "pending") ||
      (loanStatus === "submitted" && bankPendingStatus === "pending") ||
      project.bankAtPendingDate)
  ) {
    return "loan_pending";
  }

  // ── Step 5: Payment / Bank Loan Apply ──
  if (
    leadStatus === "bank loan apply" ||
    leadStatus === "payment" ||
    loanStatus === "approved" ||
    loanStatus === "submitted" ||
    paymentStatus === "completed" ||
    (project.paymentAmount && Number(project.paymentAmount) > 0) ||
    (project.loanAmount && Number(project.loanAmount) > 0) ||
    project.loanApprovalDate ||
    (project.paymentType && project.paymentType !== "Bank Loan" && paymentStatus !== "pending")
  ) {
    return "payment";
  }

  // ── Step 6: Document Submission ──
  if (
    leadStatus === "document submission" ||
    leadStatus === "document" ||
    isDocumentVerified(project.documentStatus, project)
  ) {
    return "document";
  }

  // ── Step 7: Registration ──
  if (
    leadStatus === "registration" ||
    registrationStatus === "approval" ||
    registrationStatus === "completed" ||
    registrationStatus === "approved" ||
    project.dateOfRegistration ||
    project.registrationNumber
  ) {
    return "registration";
  }

  return "lead_converted";
};
