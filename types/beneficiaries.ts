import type { Beneficiary } from "@/db/schema";

import { z } from "zod";

export const RelationshipTypes = {
  SPOUSE: "spouse",
  CHILD: "child",
  PARENT: "parent",
  SIBLING: "sibling",
  GRANDCHILD: "grandchild",
  GRANDPARENT: "grandparent",
  NIECE_NEPHEW: "niece_nephew",
  AUNT_UNCLE: "aunt_uncle",
  COUSIN: "cousin",
  FRIEND: "friend",
  CHARITY: "charity",
  OTHER: "other",
} as const;

export type RelationshipType =
  (typeof RelationshipTypes)[keyof typeof RelationshipTypes];

export const relationshipTypeLabels: Record<RelationshipType, string> = {
  [RelationshipTypes.SPOUSE]: "Spouse",
  [RelationshipTypes.CHILD]: "Child",
  [RelationshipTypes.PARENT]: "Parent",
  [RelationshipTypes.SIBLING]: "Sibling",
  [RelationshipTypes.GRANDCHILD]: "Grandchild",
  [RelationshipTypes.GRANDPARENT]: "Grandparent",
  [RelationshipTypes.NIECE_NEPHEW]: "Niece/Nephew",
  [RelationshipTypes.AUNT_UNCLE]: "Aunt/Uncle",
  [RelationshipTypes.COUSIN]: "Cousin",
  [RelationshipTypes.FRIEND]: "Friend",
  [RelationshipTypes.CHARITY]: "Charity/Organization",
  [RelationshipTypes.OTHER]: "Other",
};

export const IrishCounties = [
  "Antrim",
  "Armagh",
  "Carlow",
  "Cavan",
  "Clare",
  "Cork",
  "Derry",
  "Donegal",
  "Down",
  "Dublin",
  "Fermanagh",
  "Galway",
  "Kerry",
  "Kildare",
  "Kilkenny",
  "Laois",
  "Leitrim",
  "Limerick",
  "Longford",
  "Louth",
  "Mayo",
  "Meath",
  "Monaghan",
  "Offaly",
  "Roscommon",
  "Sligo",
  "Tipperary",
  "Tyrone",
  "Waterford",
  "Westmeath",
  "Wexford",
  "Wicklow",
] as const;

export const ppsNumberRegex = /^\d{7}[A-Z]{1,2}$/;
export const eircodeRegex = /^[A-Z]\d{2}\s?[A-Z0-9]{4}$/i;
export const irishPhoneRegex = /^(\+353|0)[1-9]\d{7,9}$/;

export const beneficiaryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  relationship_type: z.enum(
    Object.values(RelationshipTypes) as [string, ...string[]],
  ),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(irishPhoneRegex, "Invalid Irish phone number")
    .optional()
    .or(z.literal("")),

  pps_number: z
    .string()
    .regex(ppsNumberRegex, "Invalid PPS number format (e.g., 1234567A)")
    .optional()
    .or(z.literal("")),

  photo_url: z.string().url().optional().or(z.literal("")),

  address_line_1: z.string().max(255).optional().or(z.literal("")),
  address_line_2: z.string().max(255).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  county: z.enum(["", ...IrishCounties]).optional(),
  eircode: z
    .string()
    .regex(eircodeRegex, "Invalid Eircode format (e.g., D02 XY56)")
    .optional()
    .or(z.literal("")),
  country: z.string().max(100).default("Ireland"),

  // Inheritance fields (deprecated - handled by wills)
  percentage: z
    .number()
    .min(0, "Percentage must be at least 0")
    .max(100, "Percentage cannot exceed 100")
    .optional()
    .nullable(),

  specific_assets: z.array(z.string()).optional(),
  conditions: z.string().max(1000).optional().or(z.literal("")),
});

export type BeneficiaryFormData = z.infer<typeof beneficiaryFormSchema>;

export interface BeneficiaryWithPhoto
  extends Omit<Beneficiary, "pps_number" | "photo_url"> {
  photo_url: string | null;
  pps_number: string | null;
}

export interface BeneficiaryListResponse {
  beneficiaries: BeneficiaryWithPhoto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BeneficiarySearchParams {
  search?: string;
  relationship_type?: RelationshipType;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "created_at" | "relationship_type" | "percentage";
  sortOrder?: "asc" | "desc";
}
