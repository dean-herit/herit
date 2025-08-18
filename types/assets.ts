import { z } from "zod";

// =====================================================
// JURISDICTION SYSTEM
// =====================================================

export enum JurisdictionCode {
  IE = "IE", // Ireland
  UK = "UK", // United Kingdom
  US = "US", // United States
  EU = "EU", // European Union (general)
}

export enum CurrencyCode {
  EUR = "EUR",
  USD = "USD",
  GBP = "GBP",
  CHF = "CHF",
  CAD = "CAD",
  AUD = "AUD",
}

// =====================================================
// ASSET CATEGORIES & TYPES (IRISH-FOCUSED)
// =====================================================

export enum AssetCategory {
  FINANCIAL = "financial",
  PROPERTY = "property",
  PERSONAL = "personal",
  BUSINESS = "business",
  DIGITAL = "digital",
}

// Irish-specific asset types
export enum AssetType {
  // Financial Assets - Irish Context
  IRISH_BANK_ACCOUNT = "irish_bank_account",
  IRISH_CREDIT_UNION = "irish_credit_union",
  IRISH_BUILDING_SOCIETY = "irish_building_society",
  IRISH_INVESTMENT_ACCOUNT = "irish_investment_account",
  IRISH_SHARES_PORTFOLIO = "irish_shares_portfolio",
  IRISH_BONDS = "irish_bonds",

  // Irish Pension Assets
  IRISH_PRSA = "irish_prsa",
  IRISH_OCCUPATIONAL_PENSION = "irish_occupational_pension",
  IRISH_ARF = "irish_arf",
  IRISH_AVC = "irish_avc",
  IRISH_PERSONAL_PENSION = "irish_personal_pension",

  // Irish Property Assets
  IRISH_RESIDENTIAL_PROPERTY = "irish_residential_property",
  IRISH_COMMERCIAL_PROPERTY = "irish_commercial_property",
  IRISH_AGRICULTURAL_LAND = "irish_agricultural_land",
  IRISH_RENTAL_PROPERTY = "irish_rental_property",

  // Irish Vehicle Assets
  IRISH_MOTOR_VEHICLE = "irish_motor_vehicle",
  IRISH_COMMERCIAL_VEHICLE = "irish_commercial_vehicle",
  IRISH_MOTORCYCLE = "irish_motorcycle",
  IRISH_BOAT_VESSEL = "irish_boat_vessel",

  // Irish Business Assets
  IRISH_LIMITED_COMPANY_SHARES = "irish_limited_company_shares",
  IRISH_SOLE_TRADER_BUSINESS = "irish_sole_trader_business",
  IRISH_PARTNERSHIP_INTEREST = "irish_partnership_interest",
  IRISH_INTELLECTUAL_PROPERTY = "irish_intellectual_property",

  // Personal Assets (Universal)
  JEWELRY = "jewelry",
  ART_COLLECTIBLES = "art_collectibles",
  FURNITURE_HOUSEHOLD = "furniture_household",
  ELECTRONICS = "electronics",

  // Digital Assets (Universal)
  CRYPTOCURRENCY = "cryptocurrency",
  DIGITAL_CURRENCY = "digital_currency",
  ONLINE_ACCOUNTS = "online_accounts",
  DIGITAL_FILES = "digital_files",
  DOMAIN_NAMES = "domain_names",
}

// =====================================================
// IRISH-SPECIFIC ENUMS
// =====================================================

export enum IrishBankName {
  AIB = "Allied Irish Banks",
  BOI = "Bank of Ireland",
  PERMANENT_TSB = "Permanent TSB",
  ULSTER_BANK = "Ulster Bank",
  KBC_BANK = "KBC Bank Ireland",
  AVANT_MONEY = "Avant Money",
  AN_POST = "An Post Money",
  REVOLUT = "Revolut",
  N26 = "N26",
  OTHER = "Other",
}

export enum IrishCreditUnion {
  // Major Irish Credit Unions
  DUBLIN_CITY_CU = "Dublin City Credit Union",
  CORK_TEACHERS_CU = "Cork Teachers Credit Union",
  PROGRESSIVE_CU = "Progressive Credit Union",
  COMHAR_LINN_CU = "Comhar Linn Credit Union",
  ST_RAPHAELS_CU = "St. Raphael's Garda Credit Union",
  OTHER_CU = "Other Credit Union",
}

export enum IrishAccountType {
  CURRENT_ACCOUNT = "Current Account",
  SAVINGS_ACCOUNT = "Savings Account",
  TERM_DEPOSIT = "Term Deposit",
  REGULAR_SAVER = "Regular Saver",
  DEMAND_DEPOSIT = "Demand Deposit",
  FIXED_DEPOSIT = "Fixed Deposit",
  FOREIGN_CURRENCY = "Foreign Currency Account",
}

export enum IrishPensionProvider {
  IRISH_LIFE = "Irish Life",
  AVIVA = "Aviva",
  NEW_IRELAND = "New Ireland Assurance",
  ZURICH = "Zurich Life",
  STANDARD_LIFE = "Standard Life",
  CORNMARKET = "Cornmarket",
  DAVY = "Davy",
  BROKER_IRELAND = "Broker Ireland",
  COMPANY_SCHEME = "Company Pension Scheme",
  PUBLIC_SECTOR = "Public Service Pension",
  OTHER = "Other Provider",
}

export enum IrishPensionType {
  PRSA = "Personal Retirement Savings Account",
  OCCUPATIONAL_DB = "Occupational Defined Benefit",
  OCCUPATIONAL_DC = "Occupational Defined Contribution",
  ARF = "Approved Retirement Fund",
  AMRF = "Approved Minimum Retirement Fund",
  AVC = "Additional Voluntary Contribution",
  PERSONAL_PENSION = "Personal Pension Plan",
  PUBLIC_SERVICE = "Public Service Pension",
}

export enum IrishStockbroker {
  DAVY = "Davy Stockbrokers",
  GOODBODY = "Goodbody Stockbrokers",
  CANTOR_FITZGERALD = "Cantor Fitzgerald Ireland",
  KBC_STOCKBROKERS = "KBC Stockbrokers",
  INVESTEC = "Investec",
  INTERACTIVE_BROKERS = "Interactive Brokers",
  DEGIRO = "DeGiro",
  TRADING212 = "Trading 212",
  REVOLUT_TRADING = "Revolut Trading",
  OTHER = "Other Broker",
}

export enum IrishPropertyType {
  DETACHED_HOUSE = "Detached House",
  SEMI_DETACHED_HOUSE = "Semi-Detached House",
  TERRACED_HOUSE = "Terraced House",
  APARTMENT = "Apartment",
  DUPLEX = "Duplex",
  BUNGALOW = "Bungalow",
  COTTAGE = "Cottage",
  COMMERCIAL_OFFICE = "Commercial Office",
  RETAIL_UNIT = "Retail Unit",
  WAREHOUSE = "Warehouse",
  INDUSTRIAL_UNIT = "Industrial Unit",
  AGRICULTURAL_LAND = "Agricultural Land",
  DEVELOPMENT_LAND = "Development Land",
  FORESTRY = "Forestry",
}

// =====================================================
// BASE INTERFACES
// =====================================================

// Base Asset Interface (matches current database schema)
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

// Extended Asset Interface with jurisdiction support
export interface ExtendedAsset extends Asset {
  jurisdiction: JurisdictionCode;
  category: AssetCategory;
  currency: CurrencyCode;
  irish_fields?: IrishAssetFields;
  uk_fields?: Record<string, any>; // Future UK expansion
  us_fields?: Record<string, any>; // Future US expansion
  documents?: AssetDocument[];
  beneficiary_allocations?: BeneficiaryAllocation[];
}

// =====================================================
// IRISH-SPECIFIC FIELD INTERFACES
// =====================================================

export interface IrishAssetFields {
  // Bank Account Specific
  iban?: string;
  bic_swift?: string;
  sort_code?: string;
  irish_bank_name?: IrishBankName;
  irish_account_type?: IrishAccountType;
  branch_code?: string;
  branch_name?: string;
  joint_account?: boolean;
  joint_account_holder?: string;
  credit_union_name?: IrishCreditUnion;
  membership_number?: string;

  // Investment/Shares Specific
  stockbroker?: IrishStockbroker;
  portfolio_id?: string;
  stock_exchange?: string; // ISEQ, Euronext Dublin, LSE, etc.
  company_name?: string;
  ticker_symbol?: string;
  isin_code?: string;
  number_of_shares?: number;
  share_class?: string;
  certificate_numbers?: string;

  // Pension Specific
  pension_provider?: IrishPensionProvider;
  pension_type?: IrishPensionType;
  pension_number?: string;
  membership_number_pension?: string;
  employer_name?: string;
  pensionable_service_years?: number;
  defined_benefit?: boolean;
  annual_contribution?: number;
  employer_contribution?: number;
  avc_fund_value?: number;
  arf_provider?: string;
  minimum_distribution_rate?: number;
  death_in_service_benefit?: number;
  spouse_pension_rights?: boolean;
  beneficiary_nominations?: string[];

  // Property Specific
  eircode?: string;
  folio_number?: string;
  county_registration?: string;
  title_type?: "F" | "L"; // Freehold or Leasehold
  land_registry_registered?: boolean;
  registry_map_reference?: string;
  property_type?: IrishPropertyType;
  mortgage_lender?: string;
  mortgage_account_number?: string;
  outstanding_mortgage?: number;
  monthly_mortgage_payment?: number;
  lpt_valuation?: number; // Local Property Tax
  rental_income?: number;
  property_management_company?: string;
  ber_rating?: string; // Building Energy Rating
  ber_certificate_number?: string;

  // Vehicle Specific
  vehicle_registration_number?: string; // Irish VRN
  vin_number?: string;
  engine_size?: string;
  fuel_type?: string;
  nct_expiry_date?: string; // National Car Test
  motor_tax_expiry?: string;
  insurance_company?: string;
  insurance_policy_number?: string;
  current_mileage?: number;
  logbook_number?: string; // Vehicle Registration Certificate

  // Business Specific
  cro_number?: string; // Companies Registration Office
  business_address?: string;
  registered_address?: string;
  tax_number?: string;
  vat_registration?: string;
  share_class_business?: string;
  number_of_shares_business?: number;
  percentage_ownership?: number;
  director_status?: boolean;
  secretary_status?: boolean;
  shareholder_agreement?: boolean;
  articles_of_association?: boolean;

  // Digital Asset Specific
  wallet_address?: string;
  private_key_location?: string;
  exchange_platform?: string;
  recovery_phrase_location?: string;
  two_factor_auth?: boolean;
  digital_legacy_contact?: string;
}

// =====================================================
// FORM DATA INTERFACES
// =====================================================

export interface AssetFormData {
  name: string;
  asset_type: AssetType;
  category: AssetCategory;
  jurisdiction: JurisdictionCode;
  value: number;
  currency: CurrencyCode;
  description?: string;

  // Irish-specific fields (conditionally required based on asset type)
  irish_fields?: Partial<IrishAssetFields>;

  // Additional metadata
  purchase_date?: string;
  purchase_price?: number;
  last_valuation_date?: string;
  notes?: string;
}

// =====================================================
// SUPPORTING INTERFACES
// =====================================================

export interface AssetDocument {
  id: string;
  asset_id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: string;
}

export interface BeneficiaryAllocation {
  id: string;
  asset_id: string;
  beneficiary_id: string;
  percentage: number;
  specific_instructions?: string;
  conditions?: string;
}

// =====================================================
// ASSET TYPE DEFINITIONS
// =====================================================

interface AssetTypeConfig {
  name: string;
  category: AssetCategory;
  jurisdiction: JurisdictionCode;
  icon: string;
  description: string;
  requiredFields: (keyof IrishAssetFields)[];
  optionalFields: (keyof IrishAssetFields)[];
  probateDocuments: string[];
  taxImplications: string[];
}

export const IrishAssetTypeDefinitions: Record<AssetType, AssetTypeConfig> = {
  // Irish Financial Assets
  [AssetType.IRISH_BANK_ACCOUNT]: {
    name: "Irish Bank Account",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🏦",
    description:
      "Current account, savings account, or deposit account with an Irish bank",
    requiredFields: [
      "iban",
      "bic_swift",
      "irish_bank_name",
      "irish_account_type",
    ],
    optionalFields: [
      "branch_code",
      "branch_name",
      "joint_account",
      "joint_account_holder",
    ],
    probateDocuments: [
      "Bank statements (12 months)",
      "Account closure confirmation",
      "Interest certificates",
    ],
    taxImplications: [
      "DIRT tax on interest",
      "Deposit Interest Retention Tax",
      "Gift/inheritance tax implications",
    ],
  },

  [AssetType.IRISH_CREDIT_UNION]: {
    name: "Irish Credit Union Account",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🤝",
    description: "Savings or loan account with an Irish credit union",
    requiredFields: [
      "credit_union_name",
      "membership_number",
      "irish_account_type",
    ],
    optionalFields: ["joint_account", "joint_account_holder"],
    probateDocuments: [
      "Membership records",
      "Share statements",
      "Loan statements (if applicable)",
    ],
    taxImplications: ["Dividend tax implications", "Death benefit coverage"],
  },

  [AssetType.IRISH_PRSA]: {
    name: "Irish PRSA",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "📈",
    description: "Personal Retirement Savings Account",
    requiredFields: [
      "pension_provider",
      "pension_number",
      "annual_contribution",
    ],
    optionalFields: ["employer_contribution", "beneficiary_nominations"],
    probateDocuments: [
      "PRSA statements",
      "Contribution certificates",
      "Fund factsheets",
    ],
    taxImplications: [
      "Tax relief on contributions",
      "Death benefit tax treatment",
      "ARF transfer options",
    ],
  },

  [AssetType.IRISH_ARF]: {
    name: "Irish ARF",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "💰",
    description: "Approved Retirement Fund",
    requiredFields: [
      "arf_provider",
      "pension_number",
      "minimum_distribution_rate",
    ],
    optionalFields: ["beneficiary_nominations", "spouse_pension_rights"],
    probateDocuments: [
      "ARF statements",
      "Distribution records",
      "Investment portfolio details",
    ],
    taxImplications: [
      "Annual distribution requirements",
      "Spouse transfer benefits",
      "Income tax on distributions",
    ],
  },

  [AssetType.IRISH_SHARES_PORTFOLIO]: {
    name: "Irish Share Portfolio",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "📊",
    description: "Portfolio of shares and securities",
    requiredFields: ["stockbroker", "portfolio_id"],
    optionalFields: [
      "company_name",
      "ticker_symbol",
      "isin_code",
      "number_of_shares",
      "share_class",
    ],
    probateDocuments: [
      "Portfolio statements",
      "Share certificates",
      "Dividend records",
      "Contract notes",
    ],
    taxImplications: [
      "Capital gains tax",
      "Dividend withholding tax",
      "Inheritance tax implications",
    ],
  },

  // Irish Property Assets
  [AssetType.IRISH_RESIDENTIAL_PROPERTY]: {
    name: "Irish Residential Property",
    category: AssetCategory.PROPERTY,
    jurisdiction: JurisdictionCode.IE,
    icon: "🏠",
    description: "Residential property in Ireland",
    requiredFields: ["eircode", "property_type", "lpt_valuation"],
    optionalFields: [
      "folio_number",
      "county_registration",
      "title_type",
      "land_registry_registered",
      "mortgage_lender",
      "mortgage_account_number",
      "outstanding_mortgage",
      "ber_rating",
    ],
    probateDocuments: [
      "Title deeds/Folio",
      "Property deeds",
      "Mortgage statements",
      "LPT certificates",
      "BER certificate",
    ],
    taxImplications: [
      "Capital gains tax",
      "Local Property Tax",
      "Inheritance tax",
      "Principal residence relief",
    ],
  },

  [AssetType.IRISH_AGRICULTURAL_LAND]: {
    name: "Irish Agricultural Land",
    category: AssetCategory.PROPERTY,
    jurisdiction: JurisdictionCode.IE,
    icon: "🚜",
    description: "Agricultural land and farming property",
    requiredFields: ["eircode", "folio_number", "lpt_valuation"],
    optionalFields: [
      "county_registration",
      "title_type",
      "land_registry_registered",
    ],
    probateDocuments: [
      "Folio and maps",
      "Agricultural entitlements",
      "Environmental compliance certificates",
    ],
    taxImplications: [
      "Agricultural relief",
      "Capital acquisitions tax relief",
      "Single Payment Scheme entitlements",
    ],
  },

  // Irish Vehicle Assets
  [AssetType.IRISH_MOTOR_VEHICLE]: {
    name: "Irish Motor Vehicle",
    category: AssetCategory.PERSONAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🚗",
    description: "Car, van, or other motor vehicle registered in Ireland",
    requiredFields: ["vehicle_registration_number", "vin_number"],
    optionalFields: [
      "engine_size",
      "fuel_type",
      "nct_expiry_date",
      "motor_tax_expiry",
      "insurance_company",
      "insurance_policy_number",
      "current_mileage",
      "logbook_number",
    ],
    probateDocuments: [
      "Vehicle Registration Certificate (Logbook)",
      "NCT certificate",
      "Insurance certificate",
      "Motor tax disc",
    ],
    taxImplications: [
      "Capital gains (if applicable)",
      "Gift/inheritance tax valuation",
    ],
  },

  // Irish Business Assets
  [AssetType.IRISH_LIMITED_COMPANY_SHARES]: {
    name: "Irish Limited Company Shares",
    category: AssetCategory.BUSINESS,
    jurisdiction: JurisdictionCode.IE,
    icon: "🏢",
    description: "Shares in an Irish private limited company",
    requiredFields: [
      "cro_number",
      "number_of_shares_business",
      "percentage_ownership",
    ],
    optionalFields: [
      "share_class_business",
      "director_status",
      "secretary_status",
      "shareholder_agreement",
      "articles_of_association",
    ],
    probateDocuments: [
      "Share certificates",
      "Articles of Association",
      "Shareholder agreements",
      "Company accounts",
      "CRO certificate",
    ],
    taxImplications: [
      "Capital gains tax",
      "Business relief",
      "Inheritance tax",
      "Dividend tax",
    ],
  },

  // Placeholder entries for other asset types (these would be fully implemented)
  [AssetType.IRISH_BUILDING_SOCIETY]: {
    name: "Irish Building Society",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🏛️",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.IRISH_INVESTMENT_ACCOUNT]: {
    name: "Irish Investment Account",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "📈",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.IRISH_BONDS]: {
    name: "Irish Bonds",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "📜",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.IRISH_OCCUPATIONAL_PENSION]: {
    name: "Irish Occupational Pension",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🏭",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.IRISH_AVC]: {
    name: "Irish AVC",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "➕",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.IRISH_PERSONAL_PENSION]: {
    name: "Irish Personal Pension",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "👤",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.IRISH_COMMERCIAL_PROPERTY]: {
    name: "Irish Commercial Property",
    category: AssetCategory.PROPERTY,
    jurisdiction: JurisdictionCode.IE,
    icon: "🏢",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.IRISH_RENTAL_PROPERTY]: {
    name: "Irish Rental Property",
    category: AssetCategory.PROPERTY,
    jurisdiction: JurisdictionCode.IE,
    icon: "🏘️",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.IRISH_COMMERCIAL_VEHICLE]: {
    name: "Irish Commercial Vehicle",
    category: AssetCategory.PERSONAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🚛",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.IRISH_MOTORCYCLE]: {
    name: "Irish Motorcycle",
    category: AssetCategory.PERSONAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🏍️",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.IRISH_BOAT_VESSEL]: {
    name: "Irish Boat/Vessel",
    category: AssetCategory.PERSONAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "⛵",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.IRISH_SOLE_TRADER_BUSINESS]: {
    name: "Irish Sole Trader Business",
    category: AssetCategory.BUSINESS,
    jurisdiction: JurisdictionCode.IE,
    icon: "👨‍💼",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.IRISH_PARTNERSHIP_INTEREST]: {
    name: "Irish Partnership Interest",
    category: AssetCategory.BUSINESS,
    jurisdiction: JurisdictionCode.IE,
    icon: "🤝",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.IRISH_INTELLECTUAL_PROPERTY]: {
    name: "Irish Intellectual Property",
    category: AssetCategory.BUSINESS,
    jurisdiction: JurisdictionCode.IE,
    icon: "💡",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.JEWELRY]: {
    name: "Jewelry",
    category: AssetCategory.PERSONAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "💍",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.ART_COLLECTIBLES]: {
    name: "Art & Collectibles",
    category: AssetCategory.PERSONAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🎨",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.FURNITURE_HOUSEHOLD]: {
    name: "Furniture & Household Items",
    category: AssetCategory.PERSONAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🪑",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.ELECTRONICS]: {
    name: "Electronics",
    category: AssetCategory.PERSONAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "📱",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.CRYPTOCURRENCY]: {
    name: "Cryptocurrency",
    category: AssetCategory.DIGITAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "₿",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.DIGITAL_CURRENCY]: {
    name: "Digital Currency",
    category: AssetCategory.DIGITAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "💰",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.ONLINE_ACCOUNTS]: {
    name: "Online Accounts",
    category: AssetCategory.DIGITAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🌐",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.DIGITAL_FILES]: {
    name: "Digital Files",
    category: AssetCategory.DIGITAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "📁",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
  [AssetType.DOMAIN_NAMES]: {
    name: "Domain Names",
    category: AssetCategory.DIGITAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🌍",
    description: "",
    requiredFields: [],
    optionalFields: [],
    probateDocuments: [],
    taxImplications: [],
  },
};

// =====================================================
// CATEGORY DEFINITIONS
// =====================================================

export const AssetCategoryDefinitions = {
  [AssetCategory.FINANCIAL]: {
    name: "Financial Assets",
    description:
      "Bank accounts, investments, pensions, and financial instruments",
    icon: "💰",
    types: [
      AssetType.IRISH_BANK_ACCOUNT,
      AssetType.IRISH_CREDIT_UNION,
      AssetType.IRISH_BUILDING_SOCIETY,
      AssetType.IRISH_INVESTMENT_ACCOUNT,
      AssetType.IRISH_SHARES_PORTFOLIO,
      AssetType.IRISH_BONDS,
      AssetType.IRISH_PRSA,
      AssetType.IRISH_OCCUPATIONAL_PENSION,
      AssetType.IRISH_ARF,
      AssetType.IRISH_AVC,
      AssetType.IRISH_PERSONAL_PENSION,
    ],
  },
  [AssetCategory.PROPERTY]: {
    name: "Property Assets",
    description: "Real estate, land, and property investments in Ireland",
    icon: "🏠",
    types: [
      AssetType.IRISH_RESIDENTIAL_PROPERTY,
      AssetType.IRISH_COMMERCIAL_PROPERTY,
      AssetType.IRISH_AGRICULTURAL_LAND,
      AssetType.IRISH_RENTAL_PROPERTY,
    ],
  },
  [AssetCategory.PERSONAL]: {
    name: "Personal Property",
    description: "Vehicles, jewelry, art, and personal belongings",
    icon: "🚗",
    types: [
      AssetType.IRISH_MOTOR_VEHICLE,
      AssetType.IRISH_COMMERCIAL_VEHICLE,
      AssetType.IRISH_MOTORCYCLE,
      AssetType.IRISH_BOAT_VESSEL,
      AssetType.JEWELRY,
      AssetType.ART_COLLECTIBLES,
      AssetType.FURNITURE_HOUSEHOLD,
      AssetType.ELECTRONICS,
    ],
  },
  [AssetCategory.BUSINESS]: {
    name: "Business Assets",
    description:
      "Business interests, company shares, and commercial investments",
    icon: "🏢",
    types: [
      AssetType.IRISH_LIMITED_COMPANY_SHARES,
      AssetType.IRISH_SOLE_TRADER_BUSINESS,
      AssetType.IRISH_PARTNERSHIP_INTEREST,
      AssetType.IRISH_INTELLECTUAL_PROPERTY,
    ],
  },
  [AssetCategory.DIGITAL]: {
    name: "Digital Assets",
    description: "Cryptocurrency, online accounts, and digital property",
    icon: "💻",
    types: [
      AssetType.CRYPTOCURRENCY,
      AssetType.DIGITAL_CURRENCY,
      AssetType.ONLINE_ACCOUNTS,
      AssetType.DIGITAL_FILES,
      AssetType.DOMAIN_NAMES,
    ],
  },
};

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

// IBAN validation for Ireland (IE + 2 check digits + 4 bank code + 6 sort code + 8 account number = 22 chars)
const irishIBANRegex = /^IE[0-9]{2}[A-Z]{4}[0-9]{14}$/;

// Irish Eircode validation (7 characters: 3 letters/digits + space + 4 characters)
const eircodeRegex = /^[A-Z0-9]{3}\s?[A-Z0-9]{4}$/i;

// Irish VRN validation (various formats, but typically 3 digits + 1-2 letters + 1-4 digits)
const irishVRNRegex = /^[0-9]{2,3}-[A-Z]{1,2}-[0-9]{1,6}$/;

export const IrishAssetFormSchema = z.object({
  name: z.string().min(1, "Asset name is required").max(255, "Name too long"),
  asset_type: z.nativeEnum(AssetType),
  category: z.nativeEnum(AssetCategory),
  jurisdiction: z.nativeEnum(JurisdictionCode),
  value: z
    .number()
    .min(0, "Value must be positive")
    .max(999999999, "Value too large"),
  currency: z.nativeEnum(CurrencyCode).default(CurrencyCode.EUR),
  description: z.string().max(1000, "Description too long").optional(),

  irish_fields: z
    .object({
      // Bank account fields
      iban: z
        .string()
        .regex(irishIBANRegex, "Invalid Irish IBAN format")
        .optional(),
      bic_swift: z.string().min(8).max(11).optional(),
      irish_bank_name: z.nativeEnum(IrishBankName).optional(),
      irish_account_type: z.nativeEnum(IrishAccountType).optional(),
      joint_account: z.boolean().optional(),

      // Property fields
      eircode: z
        .string()
        .regex(eircodeRegex, "Invalid Eircode format")
        .optional(),
      folio_number: z.string().max(50).optional(),
      property_type: z.nativeEnum(IrishPropertyType).optional(),
      lpt_valuation: z.number().min(0).optional(),

      // Pension fields
      pension_provider: z.nativeEnum(IrishPensionProvider).optional(),
      pension_type: z.nativeEnum(IrishPensionType).optional(),
      annual_contribution: z.number().min(0).optional(),

      // Vehicle fields
      vehicle_registration_number: z
        .string()
        .regex(irishVRNRegex, "Invalid Irish vehicle registration")
        .optional(),
      vin_number: z.string().length(17, "VIN must be 17 characters").optional(),

      // Business fields
      cro_number: z.string().max(20).optional(),
      percentage_ownership: z.number().min(0).max(100).optional(),

      // Other common fields
      purchase_date: z.string().optional(),
      purchase_price: z.number().min(0).optional(),
    })
    .optional(),

  // Additional metadata
  notes: z.string().max(2000).optional(),
});

// =====================================================
// CURRENCY & FORMATTING
// =====================================================

export const CurrencyOptions = [
  { value: CurrencyCode.EUR, label: "Euro (€)", symbol: "€" },
  { value: CurrencyCode.GBP, label: "British Pound (£)", symbol: "£" },
  { value: CurrencyCode.USD, label: "US Dollar ($)", symbol: "$" },
  { value: CurrencyCode.CHF, label: "Swiss Franc (CHF)", symbol: "CHF" },
  { value: CurrencyCode.CAD, label: "Canadian Dollar (CAD)", symbol: "CAD" },
  { value: CurrencyCode.AUD, label: "Australian Dollar (AUD)", symbol: "AUD" },
];

export const formatCurrency = (
  amount: number,
  currency: CurrencyCode = CurrencyCode.EUR,
): string => {
  const currencyOption = CurrencyOptions.find((c) => c.value === currency);

  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export const getAssetCategoryFromType = (
  assetType: AssetType,
): AssetCategory => {
  const typeDefinition = IrishAssetTypeDefinitions[assetType];

  return typeDefinition?.category || AssetCategory.PERSONAL;
};

export const getAssetTypesByCategory = (
  category: AssetCategory,
): AssetType[] => {
  return AssetCategoryDefinitions[category]?.types || [];
};

export const getAssetTypesByJurisdiction = (
  jurisdiction: JurisdictionCode,
): AssetType[] => {
  return Object.entries(IrishAssetTypeDefinitions)
    .filter(([_, config]) => config.jurisdiction === jurisdiction)
    .map(([type, _]) => type as AssetType);
};

export const isIrishAssetType = (assetType: AssetType): boolean => {
  return (
    IrishAssetTypeDefinitions[assetType]?.jurisdiction === JurisdictionCode.IE
  );
};

// =====================================================
// TYPE EXPORTS
// =====================================================

export type AssetFormDataType = z.infer<typeof IrishAssetFormSchema>;
export type NewAsset = Omit<Asset, "id" | "created_at" | "updated_at">;
export type AssetUpdate = Partial<
  Omit<Asset, "id" | "user_email" | "created_at" | "updated_at">
>;
