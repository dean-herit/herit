import { z } from "zod";
import { AssetType } from "./assets-v2";

// =====================================================
// DOCUMENT ENUMS AND TYPES
// =====================================================

export enum DocumentCategory {
  LEGAL = "legal",
  FINANCIAL = "financial",
  VALUATION = "valuation",
  OWNERSHIP = "ownership",
  CERTIFICATE = "certificate",
  STATEMENT = "statement",
  AGREEMENT = "agreement",
  REGISTRATION = "registration",
  INSURANCE = "insurance",
  TAX = "tax",
  COMPLIANCE = "compliance",
  OTHER = "other",
}

export enum DocumentStatus {
  PENDING = "pending",
  UPLOADED = "uploaded",
  VERIFIED = "verified",
  EXPIRED = "expired",
  REJECTED = "rejected",
}

export enum DocumentPriority {
  REQUIRED = "required",
  RECOMMENDED = "recommended",
  OPTIONAL = "optional",
}

// =====================================================
// IRISH-SPECIFIC DOCUMENT TYPES
// =====================================================

export enum IrishFinancialDocumentType {
  // Bank & Credit Union
  BANK_STATEMENT = "bank_statement",
  ACCOUNT_OPENING_DOCS = "account_opening_docs",
  SHARE_CERTIFICATE = "share_certificate",
  MEMBERSHIP_CERT = "membership_certificate",
  NOMINATION_FORM = "nomination_form",
  
  // Investments
  SHARE_CERT = "share_certificate",
  PORTFOLIO_VALUATION = "portfolio_valuation",
  BROKER_STATEMENT = "broker_statement",
  DEALING_NOTE = "dealing_note",
  DIVIDEND_STATEMENT = "dividend_statement",
  
  // Pensions
  BENEFIT_STATEMENT = "benefit_statement",
  SCHEME_MEMBERSHIP = "scheme_membership",
  EXPRESSION_OF_WISH = "expression_of_wish",
  TRANSFER_VALUE = "transfer_value",
  RETIREMENT_OPTIONS = "retirement_options",
  
  // Insurance
  POLICY_DOCUMENT = "policy_document",
  PREMIUM_RECEIPT = "premium_receipt",
  SURRENDER_VALUE = "surrender_value",
  BENEFICIARY_NOMINATION = "beneficiary_nomination",
}

export enum IrishPropertyDocumentType {
  // Title & Ownership
  TITLE_DEEDS = "title_deeds",
  LAND_REGISTRY_FOLIO = "land_registry_folio",
  REGISTRY_OF_DEEDS = "registry_of_deeds",
  
  // Property Details
  BER_CERTIFICATE = "ber_certificate",
  PLANNING_PERMISSION = "planning_permission",
  COMPLIANCE_CERT = "compliance_certificate",
  FIRE_SAFETY_CERT = "fire_safety_certificate",
  
  // Financial
  MORTGAGE_DOCS = "mortgage_documents",
  LPT_RECEIPT = "lpt_receipt",
  COMMERCIAL_RATES = "commercial_rates",
  MANAGEMENT_FEES = "management_fees",
  
  // Rental
  LEASE_AGREEMENT = "lease_agreement",
  RTB_REGISTRATION = "rtb_registration",
  RENT_ROLL = "rent_roll",
  
  // Agricultural
  BASIC_PAYMENT_SCHEME = "basic_payment_scheme",
  ENTITLEMENTS = "entitlements",
  FORESTRY_GRANTS = "forestry_grants",
  ENVIRONMENTAL_SCHEME = "environmental_scheme",
}

export enum IrishBusinessDocumentType {
  // Company
  SHARE_CERTIFICATE = "share_certificate",
  CRO_CERT = "cro_certificate",
  ANNUAL_RETURN_B1 = "annual_return_b1",
  SHAREHOLDERS_AGREEMENT = "shareholders_agreement",
  COMPANY_CONSTITUTION = "company_constitution",
  
  // Sole Trader/Partnership
  BUSINESS_REGISTRATION = "business_registration",
  TAX_REGISTRATION = "tax_registration",
  PARTNERSHIP_AGREEMENT = "partnership_agreement",
  VAT_REGISTRATION = "vat_registration",
  
  // Financial
  FINANCIAL_STATEMENTS = "financial_statements",
  TAX_RETURNS = "tax_returns",
  TAX_CLEARANCE = "tax_clearance_certificate",
  MANAGEMENT_ACCOUNTS = "management_accounts",
}

export enum IrishPersonalDocumentType {
  // Vehicles
  VRC = "vehicle_registration_certificate",
  NCT_CERT = "nct_certificate",
  INSURANCE_DISC = "insurance_disc",
  PURCHASE_INVOICE = "purchase_invoice",
  
  // Boats
  BOAT_REGISTRATION = "boat_registration",
  MARINE_SURVEY = "marine_survey",
  MOORING_AGREEMENT = "mooring_agreement",
  
  // Valuables
  VALUATION_CERT = "valuation_certificate",
  PURCHASE_RECEIPT = "purchase_receipt",
  AUTHENTICITY_CERT = "authenticity_certificate",
  INSURANCE_APPRAISAL = "insurance_appraisal",
}

export enum DigitalDocumentType {
  WALLET_ADDRESS = "wallet_address",
  EXCHANGE_STATEMENT = "exchange_statement",
  TRANSACTION_HISTORY = "transaction_history",
  DOMAIN_REGISTRATION = "domain_registration",
  ACCOUNT_VERIFICATION = "account_verification",
}

// =====================================================
// DOCUMENT SCHEMAS
// =====================================================

export const DocumentMetadataSchema = z.object({
  id: z.string().uuid(),
  assetId: z.string().uuid(),
  userEmail: z.string().email(),
  
  // File information
  fileName: z.string(),
  originalName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  
  // Storage
  blobUrl: z.string().url(),
  blobPathname: z.string(),
  blobDownloadUrl: z.string().url().optional(),
  
  // Categorization
  category: z.nativeEnum(DocumentCategory),
  documentType: z.string(),
  priority: z.nativeEnum(DocumentPriority).optional(), // Derived from requirements, not stored in DB
  status: z.nativeEnum(DocumentStatus).optional(), // Derived/computed, not stored in DB
  
  // Additional metadata
  description: z.string().optional(),
  expiryDate: z.date().optional(),
  issueDate: z.date().optional(),
  
  // Timestamps
  uploadedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const DocumentUploadSchema = z.object({
  assetId: z.string().uuid(),
  category: z.nativeEnum(DocumentCategory),
  documentType: z.string(),
  description: z.string().optional(),
  expiryDate: z.string().optional(),
  issueDate: z.string().optional(),
});

export const DocumentRequirementSchema = z.object({
  assetType: z.string(),
  documentType: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  priority: z.nativeEnum(DocumentPriority),
  category: z.nativeEnum(DocumentCategory),
  helpText: z.string().optional(),
  exampleFormats: z.array(z.string()).optional(),
});

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type DocumentUpload = z.infer<typeof DocumentUploadSchema>;
export type DocumentRequirement = z.infer<typeof DocumentRequirementSchema>;

export interface DocumentRequirementSet {
  assetType: AssetType;
  required: DocumentRequirement[];
  recommended: DocumentRequirement[];
  optional: DocumentRequirement[];
}

export interface DocumentUploadProgress {
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  error?: string;
}

export interface DocumentFilter {
  category?: DocumentCategory;
  status?: DocumentStatus;
  documentType?: string;
  searchTerm?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface DocumentStats {
  total: number;
  byCategory: Record<DocumentCategory, number>;
  byStatus: Record<DocumentStatus, number>;
  totalSize: number;
  lastUpdated: Date;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function getDocumentCategoryDisplay(category: DocumentCategory): string {
  const displays: Record<DocumentCategory, string> = {
    [DocumentCategory.LEGAL]: "Legal Documents",
    [DocumentCategory.FINANCIAL]: "Financial Records",
    [DocumentCategory.VALUATION]: "Valuations",
    [DocumentCategory.OWNERSHIP]: "Ownership Proof",
    [DocumentCategory.CERTIFICATE]: "Certificates",
    [DocumentCategory.STATEMENT]: "Statements",
    [DocumentCategory.AGREEMENT]: "Agreements",
    [DocumentCategory.REGISTRATION]: "Registrations",
    [DocumentCategory.INSURANCE]: "Insurance",
    [DocumentCategory.TAX]: "Tax Documents",
    [DocumentCategory.COMPLIANCE]: "Compliance",
    [DocumentCategory.OTHER]: "Other",
  };
  return displays[category];
}

export function getDocumentPriorityColor(priority: DocumentPriority): string {
  const colors: Record<DocumentPriority, string> = {
    [DocumentPriority.REQUIRED]: "danger",
    [DocumentPriority.RECOMMENDED]: "warning",
    [DocumentPriority.OPTIONAL]: "default",
  };
  return colors[priority];
}

export function getDocumentStatusColor(status: DocumentStatus): string {
  const colors: Record<DocumentStatus, string> = {
    [DocumentStatus.PENDING]: "warning",
    [DocumentStatus.UPLOADED]: "primary",
    [DocumentStatus.VERIFIED]: "success",
    [DocumentStatus.EXPIRED]: "danger",
    [DocumentStatus.REJECTED]: "danger",
  };
  return colors[status];
}

export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("image")) return "🖼️";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
  return "📎";
}

export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

// =====================================================
// VALIDATION RULES
// =====================================================

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_ASSET = 50;
export const MAX_TOTAL_STORAGE_PER_USER = 500 * 1024 * 1024; // 500MB

export function validateFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type);
}

export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function isPdfFile(mimeType: string): boolean {
  return mimeType === "application/pdf";
}