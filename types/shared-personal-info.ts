import { z } from "zod";

// Irish-specific constants and validation patterns
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

// Validation regexes for Irish formats
export const ppsNumberRegex = /^\d{7}[A-Z]{1,2}$/;
export const eircodeRegex = /^[A-Z]\d{2}\s?[A-Z0-9]{4}$/i;
export const irishPhoneRegex = /^(\+353|0)[1-9]\d{7,9}$/;

// Core personal information schema - used by both onboarding and beneficiaries
export const sharedPersonalInfoSchema = z.object({
  // Basic personal details
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be less than 255 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(
      irishPhoneRegex,
      "Invalid Irish phone number (e.g., +353 1 234 5678)",
    )
    .optional()
    .or(z.literal("")),

  // Irish-specific identification
  pps_number: z
    .string()
    .regex(ppsNumberRegex, "Invalid PPS number format (e.g., 1234567A)")
    .optional()
    .or(z.literal("")),

  // Address information
  address_line_1: z.string().min(1, "Address line 1 is required").max(255),
  address_line_2: z.string().max(255).optional().or(z.literal("")),
  city: z.string().min(1, "City/Town is required").max(100),
  county: z.enum(["", ...IrishCounties] as const).optional(),
  eircode: z
    .string()
    .regex(eircodeRegex, "Invalid Eircode format (e.g., D02 XY56)")
    .optional()
    .or(z.literal("")),
  country: z.string().default("Ireland"),

  // Optional photo
  photo_url: z.string().url("Invalid photo URL").optional().or(z.literal("")),

  // Relationship - only used for beneficiaries
  relationship_type: z
    .enum(Object.values(RelationshipTypes) as [string, ...string[]])
    .optional(),
});

// Onboarding-specific schema (excludes relationship)
export const onboardingPersonalInfoSchema = sharedPersonalInfoSchema.omit({
  relationship_type: true,
});

// Beneficiary-specific schema (requires relationship + additional required fields)
export const beneficiaryPersonalInfoSchema = sharedPersonalInfoSchema.extend({
  relationship_type: z.enum(
    Object.values(RelationshipTypes) as [string, ...string[]],
  ),
  // Make these fields required for beneficiaries
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z
    .string()
    .regex(
      irishPhoneRegex,
      "Invalid Irish phone number (e.g., +353 1 234 5678)",
    )
    .min(1, "Phone number is required"),
  county: z
    .enum(["", ...IrishCounties] as const)
    .refine((val) => val !== "", "County is required"),
  eircode: z
    .string()
    .regex(eircodeRegex, "Invalid Eircode format (e.g., D02 XY56)")
    .min(1, "Eircode is required"),
});

// Type exports
export type SharedPersonalInfo = z.infer<typeof sharedPersonalInfoSchema>;
export type OnboardingPersonalInfo = z.infer<
  typeof onboardingPersonalInfoSchema
>;
export type BeneficiaryPersonalInfo = z.infer<
  typeof beneficiaryPersonalInfoSchema
>;

// Validation helper functions
export const validatePpsNumber = (pps: string): boolean => {
  return ppsNumberRegex.test(pps);
};

export const validateEircode = (eircode: string): boolean => {
  return eircodeRegex.test(eircode);
};

export const validateIrishPhone = (phone: string): boolean => {
  return irishPhoneRegex.test(phone);
};

// Form mode type
export type FormMode = "onboarding" | "beneficiary";

// Field configuration for conditional rendering
export const getFormFields = (mode: FormMode) => ({
  showRelationship: mode === "beneficiary",
  requiresPpsNumber: true, // Always collect PPS for Irish compliance
  defaultCountry: "Ireland",
});
