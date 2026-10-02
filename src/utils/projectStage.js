export const getProjectStage = (project = {}) => {
  if (!project) return "lead_converted";

  const isBankLoanType = !project.paymentType || project.paymentType === "Bank Loan";

  // If explicit stage is in projectStage / currentStage (and not the initial lead_converted placeholder)
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
      if (directStage === "ready_handover" || directStage === "handover") return "ready_handover";
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
  const docStatus = String(project.documentStatus || "").toLowerCase();

  // ── Stage 19: Handover / Ready Handover ──
  if (
    leadStatus === "handover" ||
    leadStatus === "ready_handover" ||
    leadStatus === "ready handover" ||
    project.readyHandover === "Yes"
  ) {
    return "ready_handover";
  }

  // ── Stage 18: Subsidy Received ──
  if (
    leadStatus === "subsidy received" ||
    project.subsidyReceivedStatus === "Yes" ||
    (Boolean(project.subsidyReceivedAmount) && Number(project.subsidyReceivedAmount) > 0)
  ) {
    return "subsidy_received";
  }

  // ── Stage 17: Subsidy Redeemed ──
  if (
    leadStatus === "subsidy redeemed" ||
    project.subsidyRedeemedStatus === "Yes"
  ) {
    return "subsidy_redeemed";
  }

  // ── Stage 16: DISCOM Approval ──
  if (
    leadStatus === "discom approval" ||
    project.discomApprovalStatus === "Yes"
  ) {
    return "discom_approval";
  }

  // ── Stage 15: Project Commissioning ──
  if (
    leadStatus === "project commissioning" ||
    project.projectCommissioningStatus === "Yes"
  ) {
    return "project_commissioning";
  }

  // ── Stage 14: Final Payment ──
  if (
    leadStatus === "final payment" ||
    project.duePaymentCleared === "Yes"
  ) {
    return "final_payment";
  }

  // ── Stage 13: Phase 2 Disbursement ──
  if (
    leadStatus === "phase 2 disbursement" ||
    project.phase2DisbursementPaid === "Yes" ||
    (Boolean(project.phase2DisbursementAmount) && Number(project.phase2DisbursementAmount) > 0)
  ) {
    return "phase2_disbursement";
  }

  // ── Stage 12: Meter Installation ──
  if (
    leadStatus === "meter installation" ||
    project.meterInstallationComplete === "Yes" ||
    Boolean(project.meterInstallationDate)
  ) {
    return "meter_installation";
  }

  // ── Stage 11: Inspection ──
  if (
    leadStatus === "inspection" ||
    ["by resco", "by solar coordinator", "by discom"].includes(String(project.inspectionStatus || "").toLowerCase()) ||
    Boolean(project.inspectionDocument?.url)
  ) {
    return "inspection";
  }

  // ── Stage 10: Demand Note Payment ──
  if (
    leadStatus === "demand note payment" ||
    project.demandNotePaymentPaid === "Yes" ||
    (Boolean(project.demandNotePaymentAmount) && Number(project.demandNotePaymentAmount) > 0)
  ) {
    return "demand_note_payment";
  }

  // ── Stage 9: Demand Note ──
  if (
    leadStatus === "demand note" ||
    project.demandNoteGenerated === "Yes" ||
    Boolean(project.demandNoteNumber)
  ) {
    return "demand_note";
  }

  // ── Stage 8: Notification Email ──
  if (
    leadStatus === "notification email" ||
    project.notificationEmailSent === "Yes" ||
    Boolean(project.notificationNumber)
  ) {
    return "notification_email";
  }

  // ── Stage 7: DCR Generation ──
  if (
    leadStatus === "dcr generation" ||
    project.dcrGenerated === "Yes" ||
    Boolean(project.dcrCertificate?.url)
  ) {
    return "dcr_generation";
  }

  // ── Stage 6: Installation ──
  const isInstallationExplicitlyActive =
    inst === "installation_completed" ||
    inst === "completed installation" ||
    inst === "completed_installation" ||
    inst === "load_enhancement" ||
    inst === "jee_verified" ||
    inst === "meter_charge" ||
    inst === "sent_for_jee_verification" ||
    Boolean(project.installationDate) ||
    Boolean(project.installationPartner) ||
    Boolean(project.installationDocument?.url) ||
    leadStatus === "installation completion" ||
    leadStatus === "installation";

  if (isInstallationExplicitlyActive) {
    return "installation";
  }

  // ── Stage 5: Phase 1 Disbursement ──
  const isDisbursementExplicitlyActive =
    disbursementStatus === "completed" ||
    (Boolean(project.disbursementAmount) && Number(project.disbursementAmount) > 0) ||
    Boolean(project.disbursementDate) ||
    leadStatus === "disbursement";

  if (isDisbursementExplicitlyActive) {
    return "disbursement";
  }

  // ── Stage 4: Loan Pending / Bank at Pending (Bank Loan only) ──
  if (
    isBankLoanType &&
    (leadStatus === "bank at pending" ||
      leadStatus === "loan pending" ||
      (bankPendingStatus && bankPendingStatus !== "pending") ||
      Boolean(project.bankAtPendingDate))
  ) {
    return "loan_pending";
  }

  // ── Stage 3: Payment / Bank Loan Apply ──
  if (
    leadStatus === "bank loan apply" ||
    leadStatus === "payment" ||
    loanStatus === "approved" ||
    loanStatus === "submitted" ||
    paymentStatus === "completed" ||
    (Boolean(project.paymentAmount) && Number(project.paymentAmount) > 0) ||
    (Boolean(project.loanAmount) && Number(project.loanAmount) > 0) ||
    Boolean(project.loanApprovalDate) ||
    (project.paymentType && project.paymentType !== "Bank Loan" && paymentStatus !== "pending")
  ) {
    return "payment";
  }

  // ── Stage 2: Document Submission ──
  if (
    leadStatus === "document submission" ||
    leadStatus === "document" ||
    ["submitted", "approved", "completed", "verified"].includes(docStatus) ||
    Boolean(project.documentSubmissionDate)
  ) {
    return "document";
  }

  // ── Stage 1: DISCOM Registration ──
  if (
    leadStatus === "registration" ||
    ["approval", "completed", "approved", "inprogress"].includes(registrationStatus) ||
    Boolean(project.dateOfRegistration) ||
    Boolean(project.registrationNumber) ||
    Boolean(project.applicationNumber)
  ) {
    return "registration";
  }

  // Default: Initial Stage for freshly converted leads
  return "lead_converted";
};
