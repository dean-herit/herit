import { z } from "zod";

// Asset Categories
export enum AssetCategory {
  FINANCIAL = "financial",
  PROPERTY = "property",
  PERSONAL = "personal",
  BUSINESS = "business",
  DIGITAL = "digital",
}

// Asset Types within each category
export enum AssetType {
  // Financial Assets
  BANK_ACCOUNT = "bank_account",
  SAVINGS_ACCOUNT = "savings_account",
  INVESTMENT_ACCOUNT = "investment_account",
  PENSION = "pension",
  SHARES = "shares",
  BONDS = "bonds",
  CRYPTOCURRENCY = "cryptocurrency",

  // Property Assets
  RESIDENTIAL_PROPERTY = "residential_property",
  COMMERCIAL_PROPERTY = "commercial_property",
  LAND = "land",
  RENTAL_PROPERTY = "rental_property",

  // Personal Property
  VEHICLE = "vehicle",
  JEWELRY = "jewelry",
  ART = "art",
  COLLECTIBLES = "collectibles",
  FURNITURE = "furniture",
  ELECTRONICS = "electronics",

  // Business Assets
  BUSINESS_SHARES = "business_shares",
  INTELLECTUAL_PROPERTY = "intellectual_property",
  BUSINESS_EQUIPMENT = "business_equipment",

  // Digital Assets
  DIGITAL_CURRENCY = "digital_currency",
  ONLINE_ACCOUNTS = "online_accounts",
  DIGITAL_FILES = "digital_files",
  DOMAIN_NAMES = "domain_names",
}

// Asset Status
export enum AssetStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING_VERIFICATION = "pending_verification",
  DISPUTED = "disputed",
}

// Base Asset Interface (matches database schema)
export interface Asset {
  id: string;
  user_email: string;
  name: string;
  asset_type: string;
  value: number;
  description: string | null;
  account_number: string | null;
  bank_name: string | null;
  property_address: string | null;
  status: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

// Extended Asset Interface with additional properties
export interface ExtendedAsset extends Asset {
  category: AssetCategory;
  subcategory?: string;
  currency: string;
  estimated_value?: number;
  market_value?: number;
  last_valued_at?: string;
  documents?: AssetDocument[];
  beneficiary_allocations?: BeneficiaryAllocation[];
  metadata?: Record<string, any>;
}

// Asset Document Interface
export interface AssetDocument {
  id: string;
  asset_id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: string;
}

// Beneficiary Allocation Interface
export interface BeneficiaryAllocation {
  id: string;
  asset_id: string;
  beneficiary_id: string;
  percentage: number;
  specific_instructions?: string;
  conditions?: string;
}

// Form Data Interfaces
export interface AssetFormData {
  name: string;
  asset_type: AssetType;
  category: AssetCategory;
  value: number;
  currency: string;
  description?: string;

  // Financial specific
  account_number?: string;
  bank_name?: string;
  institution_name?: string;
  account_type?: string;

  // Property specific
  property_address?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  year_built?: number;

  // Vehicle specific
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  registration?: string;

  // Business specific
  business_name?: string;
  ownership_percentage?: number;
  business_type?: string;

  // Digital specific
  platform?: string;
  username?: string;
  wallet_address?: string;

  // Additional metadata
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
}

// Validation Schemas
export const AssetFormSchema = z.object({
  name: z
    .string()
    .min(1, "Asset name is required")
    .max(255, "Name must be less than 255 characters"),
  asset_type: z.nativeEnum(AssetType),
  category: z.nativeEnum(AssetCategory),
  value: z
    .number()
    .min(0, "Value must be positive")
    .max(999999999, "Value is too large"),
  currency: z.string().min(1, "Currency is required").default("EUR"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),

  // Optional fields with conditional validation
  account_number: z.string().max(255).optional(),
  bank_name: z.string().max(255).optional(),
  institution_name: z.string().max(255).optional(),
  property_address: z.string().max(500).optional(),
  make: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  year: z
    .number()
    .min(1800)
    .max(new Date().getFullYear() + 5)
    .optional(),
  business_name: z.string().max(255).optional(),
  ownership_percentage: z.number().min(0).max(100).optional(),
  platform: z.string().max(255).optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

// Asset Category Definitions
export const AssetCategoryDefinitions = {
  [AssetCategory.FINANCIAL]: {
    name: "Financial Assets",
    description:
      "Bank accounts, investments, savings, and financial instruments",
    icon: "💰",
    types: [
      AssetType.BANK_ACCOUNT,
      AssetType.SAVINGS_ACCOUNT,
      AssetType.INVESTMENT_ACCOUNT,
      AssetType.PENSION,
      AssetType.SHARES,
      AssetType.BONDS,
      AssetType.CRYPTOCURRENCY,
    ],
  },
  [AssetCategory.PROPERTY]: {
    name: "Property Assets",
    description: "Real estate, land, and property investments",
    icon: "🏠",
    types: [
      AssetType.RESIDENTIAL_PROPERTY,
      AssetType.COMMERCIAL_PROPERTY,
      AssetType.LAND,
      AssetType.RENTAL_PROPERTY,
    ],
  },
  [AssetCategory.PERSONAL]: {
    name: "Personal Property",
    description: "Vehicles, jewelry, art, and personal belongings",
    icon: "🚗",
    types: [
      AssetType.VEHICLE,
      AssetType.JEWELRY,
      AssetType.ART,
      AssetType.COLLECTIBLES,
      AssetType.FURNITURE,
      AssetType.ELECTRONICS,
    ],
  },
  [AssetCategory.BUSINESS]: {
    name: "Business Assets",
    description: "Business interests, shares, and commercial property",
    icon: "🏢",
    types: [
      AssetType.BUSINESS_SHARES,
      AssetType.INTELLECTUAL_PROPERTY,
      AssetType.BUSINESS_EQUIPMENT,
    ],
  },
  [AssetCategory.DIGITAL]: {
    name: "Digital Assets",
    description: "Cryptocurrency, online accounts, and digital property",
    icon: "💻",
    types: [
      AssetType.DIGITAL_CURRENCY,
      AssetType.ONLINE_ACCOUNTS,
      AssetType.DIGITAL_FILES,
      AssetType.DOMAIN_NAMES,
    ],
  },
};

// Asset Type Definitions with specific field requirements
export const AssetTypeDefinitions = {
  // Financial Assets
  [AssetType.BANK_ACCOUNT]: {
    name: "Bank Account",
    category: AssetCategory.FINANCIAL,
    requiredFields: ["bank_name", "account_number"],
    optionalFields: ["account_type"],
  },
  [AssetType.SAVINGS_ACCOUNT]: {
    name: "Savings Account",
    category: AssetCategory.FINANCIAL,
    requiredFields: ["bank_name", "account_number"],
    optionalFields: ["account_type"],
  },
  [AssetType.INVESTMENT_ACCOUNT]: {
    name: "Investment Account",
    category: AssetCategory.FINANCIAL,
    requiredFields: ["institution_name", "account_number"],
    optionalFields: ["account_type"],
  },
  [AssetType.PENSION]: {
    name: "Pension Fund",
    category: AssetCategory.FINANCIAL,
    requiredFields: ["institution_name"],
    optionalFields: ["account_number"],
  },
  [AssetType.SHARES]: {
    name: "Shares & Stocks",
    category: AssetCategory.FINANCIAL,
    requiredFields: ["institution_name"],
    optionalFields: ["account_number"],
  },
  [AssetType.BONDS]: {
    name: "Bonds",
    category: AssetCategory.FINANCIAL,
    requiredFields: ["institution_name"],
    optionalFields: ["account_number"],
  },
  [AssetType.CRYPTOCURRENCY]: {
    name: "Cryptocurrency",
    category: AssetCategory.FINANCIAL,
    requiredFields: ["platform"],
    optionalFields: ["wallet_address"],
  },

  // Property Assets
  [AssetType.RESIDENTIAL_PROPERTY]: {
    name: "Residential Property",
    category: AssetCategory.PROPERTY,
    requiredFields: ["property_address"],
    optionalFields: ["bedrooms", "bathrooms", "square_feet", "year_built"],
  },
  [AssetType.COMMERCIAL_PROPERTY]: {
    name: "Commercial Property",
    category: AssetCategory.PROPERTY,
    requiredFields: ["property_address"],
    optionalFields: ["square_feet", "year_built"],
  },
  [AssetType.LAND]: {
    name: "Land",
    category: AssetCategory.PROPERTY,
    requiredFields: ["property_address"],
    optionalFields: ["square_feet"],
  },
  [AssetType.RENTAL_PROPERTY]: {
    name: "Rental Property",
    category: AssetCategory.PROPERTY,
    requiredFields: ["property_address"],
    optionalFields: ["bedrooms", "bathrooms", "square_feet"],
  },

  // Personal Property
  [AssetType.VEHICLE]: {
    name: "Vehicle",
    category: AssetCategory.PERSONAL,
    requiredFields: ["make", "model", "year"],
    optionalFields: ["vin", "registration"],
  },
  [AssetType.JEWELRY]: {
    name: "Jewelry",
    category: AssetCategory.PERSONAL,
    requiredFields: [],
    optionalFields: ["purchase_date", "purchase_price"],
  },
  [AssetType.ART]: {
    name: "Art & Collectibles",
    category: AssetCategory.PERSONAL,
    requiredFields: [],
    optionalFields: ["purchase_date", "purchase_price"],
  },
  [AssetType.COLLECTIBLES]: {
    name: "Collectibles",
    category: AssetCategory.PERSONAL,
    requiredFields: [],
    optionalFields: ["purchase_date", "purchase_price"],
  },
  [AssetType.FURNITURE]: {
    name: "Furniture",
    category: AssetCategory.PERSONAL,
    requiredFields: [],
    optionalFields: ["purchase_date", "purchase_price"],
  },
  [AssetType.ELECTRONICS]: {
    name: "Electronics",
    category: AssetCategory.PERSONAL,
    requiredFields: [],
    optionalFields: ["make", "model", "purchase_date"],
  },

  // Business Assets
  [AssetType.BUSINESS_SHARES]: {
    name: "Business Shares",
    category: AssetCategory.BUSINESS,
    requiredFields: ["business_name", "ownership_percentage"],
    optionalFields: ["business_type"],
  },
  [AssetType.INTELLECTUAL_PROPERTY]: {
    name: "Intellectual Property",
    category: AssetCategory.BUSINESS,
    requiredFields: ["business_name"],
    optionalFields: ["business_type"],
  },
  [AssetType.BUSINESS_EQUIPMENT]: {
    name: "Business Equipment",
    category: AssetCategory.BUSINESS,
    requiredFields: ["business_name"],
    optionalFields: ["purchase_date", "purchase_price"],
  },

  // Digital Assets
  [AssetType.DIGITAL_CURRENCY]: {
    name: "Digital Currency",
    category: AssetCategory.DIGITAL,
    requiredFields: ["platform"],
    optionalFields: ["wallet_address"],
  },
  [AssetType.ONLINE_ACCOUNTS]: {
    name: "Online Accounts",
    category: AssetCategory.DIGITAL,
    requiredFields: ["platform"],
    optionalFields: ["username"],
  },
  [AssetType.DIGITAL_FILES]: {
    name: "Digital Files",
    category: AssetCategory.DIGITAL,
    requiredFields: ["platform"],
    optionalFields: [],
  },
  [AssetType.DOMAIN_NAMES]: {
    name: "Domain Names",
    category: AssetCategory.DIGITAL,
    requiredFields: ["platform"],
    optionalFields: [],
  },
};

// Currency options (focusing on European/Irish context)
export const CurrencyOptions = [
  { value: "EUR", label: "Euro (€)", symbol: "€" },
  { value: "USD", label: "US Dollar ($)", symbol: "$" },
  { value: "GBP", label: "British Pound (£)", symbol: "£" },
  { value: "CHF", label: "Swiss Franc (CHF)", symbol: "CHF" },
  { value: "CAD", label: "Canadian Dollar (CAD)", symbol: "CAD" },
  { value: "AUD", label: "Australian Dollar (AUD)", symbol: "AUD" },
];

// Helper functions
export const formatCurrency = (
  amount: number,
  currency: string = "EUR",
): string => {
  const currencyOption = CurrencyOptions.find((c) => c.value === currency);
  const symbol = currencyOption?.symbol || currency;

  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const getAssetCategoryFromType = (
  assetType: AssetType,
): AssetCategory => {
  const typeDefinition = AssetTypeDefinitions[assetType];

  return typeDefinition?.category || AssetCategory.PERSONAL;
};

export const getAssetTypesByCategory = (
  category: AssetCategory,
): AssetType[] => {
  return AssetCategoryDefinitions[category]?.types || [];
};

// Export types for use in components
export type NewAsset = Omit<Asset, "id" | "created_at" | "updated_at">;
export type AssetUpdate = Partial<
  Omit<Asset, "id" | "user_email" | "created_at" | "updated_at">
>;
