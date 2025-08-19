import { z } from "zod";

// =====================================================
// CORE ENUMS AND TYPES
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

export enum AssetCategory {
  FINANCIAL = "financial",
  PROPERTY = "property",
  PERSONAL = "personal",
  BUSINESS = "business",
  DIGITAL = "digital",
}

// =====================================================
// DETAILED ASSET TYPE ENUMS
// =====================================================

export enum FinancialAssetType {
  // Bank Accounts
  IRISH_BANK_ACCOUNT = "irish_bank_account",
  IRISH_CREDIT_UNION = "irish_credit_union",
  IRISH_BUILDING_SOCIETY = "irish_building_society",

  // Investment Accounts
  IRISH_INVESTMENT_ACCOUNT = "irish_investment_account",
  IRISH_SHARES_PORTFOLIO = "irish_shares_portfolio",
  INDIVIDUAL_STOCK_HOLDING = "individual_stock_holding",
  IRISH_BONDS = "irish_bonds",
  GOVERNMENT_BONDS = "government_bonds",

  // Pensions
  IRISH_PRSA = "irish_prsa",
  IRISH_OCCUPATIONAL_PENSION = "irish_occupational_pension",
  IRISH_ARF = "irish_arf",
  IRISH_AVC = "irish_avc",
  IRISH_PERSONAL_PENSION = "irish_personal_pension",

  // Insurance
  LIFE_INSURANCE = "life_insurance",
  ENDOWMENT_POLICY = "endowment_policy",
}

export enum PropertyAssetType {
  IRISH_RESIDENTIAL_PROPERTY = "irish_residential_property",
  IRISH_COMMERCIAL_PROPERTY = "irish_commercial_property",
  IRISH_AGRICULTURAL_LAND = "irish_agricultural_land",
  IRISH_RENTAL_PROPERTY = "irish_rental_property",
}

export enum BusinessAssetType {
  IRISH_LIMITED_COMPANY_SHARES = "irish_limited_company_shares",
  IRISH_SOLE_TRADER_BUSINESS = "irish_sole_trader_business",
  IRISH_PARTNERSHIP_INTEREST = "irish_partnership_interest",
  IRISH_INTELLECTUAL_PROPERTY = "irish_intellectual_property",
}

export enum PersonalAssetType {
  IRISH_MOTOR_VEHICLE = "irish_motor_vehicle",
  IRISH_COMMERCIAL_VEHICLE = "irish_commercial_vehicle",
  IRISH_MOTORCYCLE = "irish_motorcycle",
  IRISH_BOAT_VESSEL = "irish_boat_vessel",
  JEWELRY = "jewelry",
  ART_COLLECTIBLES = "art_collectibles",
  FURNITURE_HOUSEHOLD = "furniture_household",
  ELECTRONICS = "electronics",
}

export enum DigitalAssetType {
  CRYPTOCURRENCY = "cryptocurrency",
  DIGITAL_CURRENCY = "digital_currency",
  ONLINE_ACCOUNTS = "online_accounts",
  DIGITAL_FILES = "digital_files",
  DOMAIN_NAMES = "domain_names",
}

// Union of all asset types
export type AssetType =
  | FinancialAssetType
  | PropertyAssetType
  | BusinessAssetType
  | PersonalAssetType
  | DigitalAssetType;

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
  EBS = "EBS Building Society",
  OTHER = "Other",
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

export enum StockExchange {
  EURONEXT_DUBLIN = "Euronext Dublin",
  LSE = "London Stock Exchange",
  NYSE = "New York Stock Exchange",
  NASDAQ = "NASDAQ",
  FRANKFURT = "Frankfurt Stock Exchange",
  OTHER = "Other Exchange",
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

export enum CryptocurrencyType {
  BITCOIN = "Bitcoin",
  ETHEREUM = "Ethereum",
  LITECOIN = "Litecoin",
  CARDANO = "Cardano",
  SOLANA = "Solana",
  DOGECOIN = "Dogecoin",
  OTHER = "Other Cryptocurrency",
}

export enum CryptoWalletType {
  HARDWARE_WALLET = "Hardware Wallet",
  SOFTWARE_WALLET = "Software Wallet",
  EXCHANGE_ACCOUNT = "Exchange Account",
  PAPER_WALLET = "Paper Wallet",
  MULTI_SIG_WALLET = "Multi-Signature Wallet",
}

export enum CryptoExchange {
  COINBASE = "Coinbase",
  BINANCE = "Binance",
  KRAKEN = "Kraken",
  BITFINEX = "Bitfinex",
  GEMINI = "Gemini",
  OTHER = "Other Exchange",
}

// =====================================================
// VALIDATION PATTERNS
// =====================================================

// Irish IBAN format: IE + 2 check digits + 4 bank code + 6 branch code + 8 account number
const irishIBANRegex = /^IE[0-9]{2}[A-Z]{4}[0-9]{14}$/;

// Irish Eircode format: D02 XY45 (3 chars + space + 4 chars)
const eircodeRegex = /^[A-Z0-9]{3}\s?[A-Z0-9]{4}$/;

// Irish CRO number format (various patterns)
const croNumberRegex = /^[0-9]{4,6}[A-Z]?$/;

// Irish VRN format (various formats, typically digits-letters-digits)
const irishVRNRegex = /^[0-9]{2,3}-[A-Z]{1,2}-[0-9]{1,6}$/;

// ISIN format with IE prefix
const irishISINRegex = /^IE[A-Z0-9]{9}[0-9]$/;

// Stock ticker format (1-5 uppercase letters/numbers)
const stockTickerRegex = /^[A-Z0-9]{1,5}$/;

// =====================================================
// BASE SCHEMAS
// =====================================================

const BaseAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required").max(255, "Name too long"),
  category: z.nativeEnum(AssetCategory),
  jurisdiction: z.nativeEnum(JurisdictionCode).default(JurisdictionCode.IE),
  value: z
    .number()
    .min(0, "Value must be positive")
    .max(999999999, "Value too large"),
  currency: z.nativeEnum(CurrencyCode).default(CurrencyCode.EUR),
  description: z.string().max(1000, "Description too long").optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

// =====================================================
// FINANCIAL ASSET SCHEMAS
// =====================================================

export const IrishBankAccountSchema = BaseAssetSchema.extend({
  asset_type: z.literal(FinancialAssetType.IRISH_BANK_ACCOUNT),
  category: z.literal(AssetCategory.FINANCIAL),
  specific_fields: z.object({
    iban: z.string().regex(irishIBANRegex, "Invalid Irish IBAN format"),
    bic_swift: z.string().min(8).max(11).optional(),
    irish_bank_name: z.nativeEnum(IrishBankName),
    irish_account_type: z.nativeEnum(IrishAccountType),
    sort_code: z.string().length(6, "Sort code must be 6 digits").optional(),
    account_number: z.string().min(6).max(12).optional(),
    branch_name: z.string().max(100).optional(),
    joint_account: z.boolean().default(false),
    joint_account_holder: z.string().max(255).optional(),
  }),
});

export const IndividualStockHoldingSchema = BaseAssetSchema.extend({
  asset_type: z.literal(FinancialAssetType.INDIVIDUAL_STOCK_HOLDING),
  category: z.literal(AssetCategory.FINANCIAL),
  specific_fields: z.object({
    ticker_symbol: z
      .string()
      .regex(stockTickerRegex, "Invalid ticker symbol format"),
    isin_code: z
      .string()
      .regex(irishISINRegex, "Invalid ISIN format")
      .optional(),
    company_name: z.string().min(1, "Company name is required").max(255),
    number_of_shares: z.number().min(1, "Must own at least 1 share"),
    share_class: z.string().max(50).optional(),
    stockbroker: z.nativeEnum(IrishStockbroker),
    stock_exchange: z.nativeEnum(StockExchange),
    certificate_numbers: z.string().max(255).optional(),
    dividend_yield: z.number().min(0).max(100).optional(),
    cost_basis_per_share: z.number().min(0).optional(),
  }),
});

export const CryptocurrencySchema = BaseAssetSchema.extend({
  asset_type: z.literal(DigitalAssetType.CRYPTOCURRENCY),
  category: z.literal(AssetCategory.DIGITAL),
  specific_fields: z.object({
    cryptocurrency_type: z.nativeEnum(CryptocurrencyType),
    wallet_type: z.nativeEnum(CryptoWalletType),
    wallet_address: z.string().max(255).optional(),
    exchange_name: z.nativeEnum(CryptoExchange).optional(),
    exchange_account_email: z.string().email().optional(),
    private_key_location: z.string().max(500).optional(),
    recovery_phrase_location: z.string().max(500).optional(),
    amount_held: z.number().min(0).optional(),
    cost_basis: z.number().min(0).optional(),
  }),
});

export const IrishPRSASchema = BaseAssetSchema.extend({
  asset_type: z.literal(FinancialAssetType.IRISH_PRSA),
  category: z.literal(AssetCategory.FINANCIAL),
  specific_fields: z.object({
    pension_provider: z.nativeEnum(IrishPensionProvider),
    pension_number: z.string().min(1, "Pension number is required").max(50),
    annual_contribution: z.number().min(0).optional(),
    employer_contribution: z.number().min(0).optional(),
    fund_value: z.number().min(0).optional(),
    retirement_age: z.number().min(50).max(75).optional(),
    beneficiary_nominations: z.array(z.string()).optional(),
  }),
});

// =====================================================
// PROPERTY ASSET SCHEMAS
// =====================================================

export const IrishResidentialPropertySchema = BaseAssetSchema.extend({
  asset_type: z.literal(PropertyAssetType.IRISH_RESIDENTIAL_PROPERTY),
  category: z.literal(AssetCategory.PROPERTY),
  specific_fields: z.object({
    eircode: z.string().regex(eircodeRegex, "Invalid Eircode format"),
    folio_number: z.string().min(1, "Folio number is required").max(50),
    property_type: z.nativeEnum(IrishPropertyType),
    county: z.string().min(1).max(50),
    title_type: z.enum(["F", "L"]), // F=Freehold, L=Leasehold
    lpt_valuation: z
      .number()
      .min(0, "LPT valuation must be positive")
      .optional(),
    ber_rating: z.string().max(10).optional(),
    ber_certificate_number: z.string().max(50).optional(),
    mortgage_lender: z.string().max(100).optional(),
    mortgage_account_number: z.string().max(50).optional(),
    outstanding_mortgage: z.number().min(0).optional(),
    monthly_mortgage_payment: z.number().min(0).optional(),
    rental_income: z.number().min(0).optional(),
    property_management_company: z.string().max(100).optional(),
  }),
});

export const IrishCommercialPropertySchema = BaseAssetSchema.extend({
  asset_type: z.literal(PropertyAssetType.IRISH_COMMERCIAL_PROPERTY),
  category: z.literal(AssetCategory.PROPERTY),
  specific_fields: z.object({
    eircode: z.string().regex(eircodeRegex, "Invalid Eircode format"),
    folio_number: z.string().min(1, "Folio number is required").max(50),
    property_type: z.nativeEnum(IrishPropertyType),
    county: z.string().min(1).max(50),
    title_type: z.enum(["F", "L"]), // F=Freehold, L=Leasehold
    annual_rental_income: z.number().min(0).optional(),
    lease_expiry_date: z.string().optional(),
    tenant_details: z.string().max(255).optional(),
    property_management_company: z.string().max(100).optional(),
    rates_valuation: z.number().min(0).optional(),
    mortgage_lender: z.string().max(100).optional(),
    outstanding_mortgage: z.number().min(0).optional(),
  }),
});

export const IrishAgriculturalLandSchema = BaseAssetSchema.extend({
  asset_type: z.literal(PropertyAssetType.IRISH_AGRICULTURAL_LAND),
  category: z.literal(AssetCategory.PROPERTY),
  specific_fields: z.object({
    eircode: z
      .string()
      .regex(eircodeRegex, "Invalid Eircode format")
      .optional(),
    folio_number: z.string().min(1, "Folio number is required").max(50),
    county: z.string().min(1).max(50),
    townland: z.string().max(100).optional(),
    acreage: z.number().min(0, "Acreage must be positive"),
    land_use: z.enum(["Tillage", "Pasture", "Forest", "Mixed", "Other"]),
    soil_quality: z.enum(["Excellent", "Good", "Fair", "Poor"]).optional(),
    drainage: z
      .enum(["Well Drained", "Moderately Drained", "Poorly Drained"])
      .optional(),
    single_farm_payment_entitlements: z.boolean().default(false),
    organic_certification: z.boolean().default(false),
    turbary_rights: z.boolean().default(false),
    commonage_rights: z.boolean().default(false),
  }),
});

// =====================================================
// BUSINESS ASSET SCHEMAS
// =====================================================

export const IrishCompanySharesSchema = BaseAssetSchema.extend({
  asset_type: z.literal(BusinessAssetType.IRISH_LIMITED_COMPANY_SHARES),
  category: z.literal(AssetCategory.BUSINESS),
  specific_fields: z.object({
    cro_number: z.string().regex(croNumberRegex, "Invalid CRO number format"),
    company_name: z.string().min(1, "Company name is required").max(255),
    share_class: z.string().max(50).default("Ordinary"),
    number_of_shares: z.number().min(1, "Must own at least 1 share"),
    percentage_ownership: z.number().min(0).max(100),
    nominal_value_per_share: z.number().min(0).optional(),
    voting_rights: z.boolean().default(true),
    director_status: z.boolean().default(false),
    secretary_status: z.boolean().default(false),
    shareholder_agreement_exists: z.boolean().default(false),
    dividend_rights: z.boolean().default(true),
  }),
});

export const IrishSoleTraderBusinessSchema = BaseAssetSchema.extend({
  asset_type: z.literal(BusinessAssetType.IRISH_SOLE_TRADER_BUSINESS),
  category: z.literal(AssetCategory.BUSINESS),
  specific_fields: z.object({
    business_name: z.string().min(1, "Business name is required").max(255),
    trading_name: z.string().max(255).optional(),
    tax_reference_number: z.string().max(20).optional(),
    vat_registration_number: z.string().max(20).optional(),
    business_address: z.string().max(500).optional(),
    industry_sector: z.string().max(100).optional(),
    annual_turnover: z.number().min(0).optional(),
    annual_profit: z.number().min(0).optional(),
    business_assets_value: z.number().min(0).optional(),
    business_liabilities: z.number().min(0).optional(),
    employees_count: z.number().min(0).optional(),
    lease_agreements: z.string().max(500).optional(),
  }),
});

export const IrishIntellectualPropertySchema = BaseAssetSchema.extend({
  asset_type: z.literal(BusinessAssetType.IRISH_INTELLECTUAL_PROPERTY),
  category: z.literal(AssetCategory.BUSINESS),
  specific_fields: z.object({
    ip_type: z.enum([
      "Patent",
      "Trademark",
      "Copyright",
      "Design",
      "Trade Secret",
    ]),
    registration_number: z.string().max(50).optional(),
    registration_authority: z.string().max(100).optional(),
    registration_date: z.string().optional(),
    expiry_date: z.string().optional(),
    territorial_scope: z.string().max(255).optional(),
    licensing_income: z.number().min(0).optional(),
    renewal_required: z.boolean().default(false),
    legal_representative: z.string().max(255).optional(),
  }),
});

// =====================================================
// PERSONAL ASSET SCHEMAS
// =====================================================

export const IrishMotorVehicleSchema = BaseAssetSchema.extend({
  asset_type: z.literal(PersonalAssetType.IRISH_MOTOR_VEHICLE),
  category: z.literal(AssetCategory.PERSONAL),
  specific_fields: z.object({
    vehicle_registration_number: z
      .string()
      .regex(irishVRNRegex, "Invalid Irish vehicle registration"),
    vin_number: z.string().length(17, "VIN must be 17 characters").optional(),
    make: z.string().min(1).max(50),
    model: z.string().min(1).max(50),
    year: z
      .number()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    engine_size: z.string().max(20).optional(),
    fuel_type: z
      .enum(["Petrol", "Diesel", "Electric", "Hybrid", "Other"])
      .optional(),
    nct_expiry_date: z.string().optional(),
    motor_tax_expiry: z.string().optional(),
    insurance_company: z.string().max(100).optional(),
    insurance_policy_number: z.string().max(50).optional(),
    current_mileage: z.number().min(0).optional(),
    logbook_number: z.string().max(50).optional(),
  }),
});

export const JewelrySchema = BaseAssetSchema.extend({
  asset_type: z.literal(PersonalAssetType.JEWELRY),
  category: z.literal(AssetCategory.PERSONAL),
  specific_fields: z.object({
    item_type: z.enum([
      "Ring",
      "Necklace",
      "Bracelet",
      "Watch",
      "Earrings",
      "Other",
    ]),
    material: z.string().max(100).optional(),
    gemstones: z.string().max(255).optional(),
    brand: z.string().max(100).optional(),
    model: z.string().max(100).optional(),
    serial_number: z.string().max(100).optional(),
    appraisal_date: z.string().optional(),
    appraiser_name: z.string().max(255).optional(),
    insurance_coverage: z.number().min(0).optional(),
  }),
});

export const ArtCollectiblesSchema = BaseAssetSchema.extend({
  asset_type: z.literal(PersonalAssetType.ART_COLLECTIBLES),
  category: z.literal(AssetCategory.PERSONAL),
  specific_fields: z.object({
    item_type: z.enum([
      "Painting",
      "Sculpture",
      "Photograph",
      "Print",
      "Antique",
      "Collectible",
      "Other",
    ]),
    artist_creator: z.string().max(255).optional(),
    title_name: z.string().max(255).optional(),
    year_created: z.number().min(1000).max(new Date().getFullYear()).optional(),
    medium_material: z.string().max(255).optional(),
    dimensions: z.string().max(100).optional(),
    provenance: z.string().max(1000).optional(),
    authentication_certificate: z.boolean().default(false),
    appraisal_date: z.string().optional(),
    appraiser_name: z.string().max(255).optional(),
    condition: z
      .enum(["Excellent", "Very Good", "Good", "Fair", "Poor"])
      .optional(),
    insurance_coverage: z.number().min(0).optional(),
  }),
});

export const ElectronicsSchema = BaseAssetSchema.extend({
  asset_type: z.literal(PersonalAssetType.ELECTRONICS),
  category: z.literal(AssetCategory.PERSONAL),
  specific_fields: z.object({
    item_type: z.enum([
      "Computer",
      "Laptop",
      "Smartphone",
      "Tablet",
      "TV",
      "Audio Equipment",
      "Camera",
      "Gaming Console",
      "Other",
    ]),
    brand: z.string().max(100).optional(),
    model: z.string().max(100).optional(),
    serial_number: z.string().max(100).optional(),
    year_purchased: z
      .number()
      .min(1990)
      .max(new Date().getFullYear())
      .optional(),
    warranty_expiry: z.string().optional(),
    condition: z.enum(["New", "Excellent", "Good", "Fair", "Poor"]).optional(),
    original_receipt: z.boolean().default(false),
  }),
});

// =====================================================
// ADDITIONAL DIGITAL ASSET SCHEMAS
// =====================================================

export const DomainNamesSchema = BaseAssetSchema.extend({
  asset_type: z.literal(DigitalAssetType.DOMAIN_NAMES),
  category: z.literal(AssetCategory.DIGITAL),
  specific_fields: z.object({
    domain_name: z.string().min(1, "Domain name is required").max(255),
    registrar: z.string().max(100).optional(),
    registration_date: z.string().optional(),
    expiry_date: z.string().optional(),
    auto_renewal: z.boolean().default(false),
    hosting_provider: z.string().max(100).optional(),
    annual_revenue: z.number().min(0).optional(),
    monthly_traffic: z.number().min(0).optional(),
    monetization_method: z
      .enum([
        "Advertising",
        "E-commerce",
        "Affiliate",
        "Subscription",
        "None",
        "Other",
      ])
      .optional(),
  }),
});

export const OnlineAccountsSchema = BaseAssetSchema.extend({
  asset_type: z.literal(DigitalAssetType.ONLINE_ACCOUNTS),
  category: z.literal(AssetCategory.DIGITAL),
  specific_fields: z.object({
    platform_name: z.string().min(1, "Platform name is required").max(100),
    account_type: z.enum([
      "Social Media",
      "E-commerce",
      "Professional",
      "Gaming",
      "Content Creation",
      "Other",
    ]),
    username_handle: z.string().max(100).optional(),
    follower_count: z.number().min(0).optional(),
    verified_account: z.boolean().default(false),
    monetization_enabled: z.boolean().default(false),
    estimated_monthly_earnings: z.number().min(0).optional(),
    content_ownership_rights: z.boolean().default(false),
    account_recovery_details: z.string().max(500).optional(),
  }),
});

// =====================================================
// DISCRIMINATED UNION SCHEMA
// =====================================================

export const AssetFormSchema = z.discriminatedUnion("asset_type", [
  // Financial Assets
  IrishBankAccountSchema,
  IndividualStockHoldingSchema,
  CryptocurrencySchema,
  IrishPRSASchema,

  // Property Assets
  IrishResidentialPropertySchema,
  IrishCommercialPropertySchema,
  IrishAgriculturalLandSchema,

  // Business Assets
  IrishCompanySharesSchema,
  IrishSoleTraderBusinessSchema,
  IrishIntellectualPropertySchema,

  // Personal Assets
  IrishMotorVehicleSchema,
  JewelrySchema,
  ArtCollectiblesSchema,
  ElectronicsSchema,

  // Digital Assets
  DomainNamesSchema,
  OnlineAccountsSchema,
]);

export type AssetFormData = z.infer<typeof AssetFormSchema>;

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
      FinancialAssetType.IRISH_BANK_ACCOUNT,
      FinancialAssetType.IRISH_CREDIT_UNION,
      FinancialAssetType.IRISH_BUILDING_SOCIETY,
      FinancialAssetType.IRISH_INVESTMENT_ACCOUNT,
      FinancialAssetType.IRISH_SHARES_PORTFOLIO,
      FinancialAssetType.INDIVIDUAL_STOCK_HOLDING,
      FinancialAssetType.IRISH_BONDS,
      FinancialAssetType.GOVERNMENT_BONDS,
      FinancialAssetType.IRISH_PRSA,
      FinancialAssetType.IRISH_OCCUPATIONAL_PENSION,
      FinancialAssetType.IRISH_ARF,
      FinancialAssetType.IRISH_AVC,
      FinancialAssetType.IRISH_PERSONAL_PENSION,
      FinancialAssetType.LIFE_INSURANCE,
      FinancialAssetType.ENDOWMENT_POLICY,
    ],
  },
  [AssetCategory.PROPERTY]: {
    name: "Property Assets",
    description: "Real estate, land, and property investments in Ireland",
    icon: "🏠",
    types: [
      PropertyAssetType.IRISH_RESIDENTIAL_PROPERTY,
      PropertyAssetType.IRISH_COMMERCIAL_PROPERTY,
      PropertyAssetType.IRISH_AGRICULTURAL_LAND,
      PropertyAssetType.IRISH_RENTAL_PROPERTY,
    ],
  },
  [AssetCategory.BUSINESS]: {
    name: "Business Assets",
    description:
      "Company shares, business interests, and intellectual property",
    icon: "🏢",
    types: [
      BusinessAssetType.IRISH_LIMITED_COMPANY_SHARES,
      BusinessAssetType.IRISH_SOLE_TRADER_BUSINESS,
      BusinessAssetType.IRISH_PARTNERSHIP_INTEREST,
      BusinessAssetType.IRISH_INTELLECTUAL_PROPERTY,
    ],
  },
  [AssetCategory.PERSONAL]: {
    name: "Personal Property",
    description: "Vehicles, jewelry, art, and personal belongings",
    icon: "💎",
    types: [
      PersonalAssetType.IRISH_MOTOR_VEHICLE,
      PersonalAssetType.IRISH_COMMERCIAL_VEHICLE,
      PersonalAssetType.IRISH_MOTORCYCLE,
      PersonalAssetType.IRISH_BOAT_VESSEL,
      PersonalAssetType.JEWELRY,
      PersonalAssetType.ART_COLLECTIBLES,
      PersonalAssetType.FURNITURE_HOUSEHOLD,
      PersonalAssetType.ELECTRONICS,
    ],
  },
  [AssetCategory.DIGITAL]: {
    name: "Digital Assets",
    description: "Cryptocurrency, digital files, and online assets",
    icon: "💻",
    types: [
      DigitalAssetType.CRYPTOCURRENCY,
      DigitalAssetType.DIGITAL_CURRENCY,
      DigitalAssetType.ONLINE_ACCOUNTS,
      DigitalAssetType.DIGITAL_FILES,
      DigitalAssetType.DOMAIN_NAMES,
    ],
  },
};

// =====================================================
// TYPE DEFINITIONS WITH DESCRIPTIONS
// =====================================================

export const AssetTypeDefinitions = {
  // Financial Assets
  [FinancialAssetType.IRISH_BANK_ACCOUNT]: {
    name: "Bank Account",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🏦",
    description:
      "Current accounts, savings accounts, and deposits with Irish banks",
    requiredFields: ["iban", "irish_bank_name", "irish_account_type"],
    optionalFields: ["bic_swift", "sort_code", "branch_name"],
  },
  [FinancialAssetType.INDIVIDUAL_STOCK_HOLDING]: {
    name: "Individual Stock Holding",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "📈",
    description: "Individual shares in publicly traded companies",
    requiredFields: [
      "ticker_symbol",
      "company_name",
      "number_of_shares",
      "stockbroker",
    ],
    optionalFields: ["isin_code", "share_class", "certificate_numbers"],
  },
  [FinancialAssetType.IRISH_PRSA]: {
    name: "PRSA (Personal Retirement Savings Account)",
    category: AssetCategory.FINANCIAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🏛️",
    description:
      "Personal retirement savings accounts with Irish pension providers",
    requiredFields: ["pension_provider", "pension_number"],
    optionalFields: [
      "annual_contribution",
      "fund_value",
      "beneficiary_nominations",
    ],
  },

  // Property Assets
  [PropertyAssetType.IRISH_RESIDENTIAL_PROPERTY]: {
    name: "Residential Property",
    category: AssetCategory.PROPERTY,
    jurisdiction: JurisdictionCode.IE,
    icon: "🏠",
    description: "Houses, apartments, and residential real estate in Ireland",
    requiredFields: ["eircode", "folio_number", "property_type"],
    optionalFields: ["lpt_valuation", "ber_rating", "mortgage_lender"],
  },
  [PropertyAssetType.IRISH_COMMERCIAL_PROPERTY]: {
    name: "Commercial Property",
    category: AssetCategory.PROPERTY,
    jurisdiction: JurisdictionCode.IE,
    icon: "🏢",
    description: "Office buildings, retail units, and commercial real estate",
    requiredFields: ["eircode", "folio_number", "property_type"],
    optionalFields: [
      "annual_rental_income",
      "tenant_details",
      "rates_valuation",
    ],
  },
  [PropertyAssetType.IRISH_AGRICULTURAL_LAND]: {
    name: "Agricultural Land",
    category: AssetCategory.PROPERTY,
    jurisdiction: JurisdictionCode.IE,
    icon: "🚜",
    description: "Farmland, pasture, and agricultural property",
    requiredFields: ["folio_number", "county", "acreage", "land_use"],
    optionalFields: [
      "eircode",
      "soil_quality",
      "single_farm_payment_entitlements",
    ],
  },

  // Business Assets
  [BusinessAssetType.IRISH_LIMITED_COMPANY_SHARES]: {
    name: "Company Shares",
    category: AssetCategory.BUSINESS,
    jurisdiction: JurisdictionCode.IE,
    icon: "📊",
    description: "Shares in Irish limited companies",
    requiredFields: ["cro_number", "company_name", "number_of_shares"],
    optionalFields: ["share_class", "voting_rights", "director_status"],
  },
  [BusinessAssetType.IRISH_SOLE_TRADER_BUSINESS]: {
    name: "Sole Trader Business",
    category: AssetCategory.BUSINESS,
    jurisdiction: JurisdictionCode.IE,
    icon: "👤",
    description: "Individual trading businesses and sole proprietorships",
    requiredFields: ["business_name"],
    optionalFields: [
      "tax_reference_number",
      "annual_turnover",
      "employees_count",
    ],
  },
  [BusinessAssetType.IRISH_INTELLECTUAL_PROPERTY]: {
    name: "Intellectual Property",
    category: AssetCategory.BUSINESS,
    jurisdiction: JurisdictionCode.IE,
    icon: "💡",
    description:
      "Patents, trademarks, copyrights, and intellectual property rights",
    requiredFields: ["ip_type"],
    optionalFields: ["registration_number", "expiry_date", "licensing_income"],
  },

  // Personal Assets
  [PersonalAssetType.IRISH_MOTOR_VEHICLE]: {
    name: "Motor Vehicle",
    category: AssetCategory.PERSONAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🚗",
    description: "Cars, motorcycles, and other motor vehicles",
    requiredFields: ["vehicle_registration_number", "make", "model", "year"],
    optionalFields: ["vin_number", "engine_size", "nct_expiry_date"],
  },
  [PersonalAssetType.JEWELRY]: {
    name: "Jewelry",
    category: AssetCategory.PERSONAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "💎",
    description: "Rings, watches, necklaces, and precious jewelry",
    requiredFields: ["item_type"],
    optionalFields: ["material", "brand", "serial_number", "appraisal_date"],
  },
  [PersonalAssetType.ART_COLLECTIBLES]: {
    name: "Art & Collectibles",
    category: AssetCategory.PERSONAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🎨",
    description: "Paintings, sculptures, antiques, and valuable collectibles",
    requiredFields: ["item_type"],
    optionalFields: [
      "artist_creator",
      "year_created",
      "authentication_certificate",
    ],
  },
  [PersonalAssetType.ELECTRONICS]: {
    name: "Electronics",
    category: AssetCategory.PERSONAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "📱",
    description: "Computers, smartphones, and electronic devices",
    requiredFields: ["item_type"],
    optionalFields: ["brand", "model", "serial_number", "warranty_expiry"],
  },

  // Digital Assets
  [DigitalAssetType.CRYPTOCURRENCY]: {
    name: "Cryptocurrency",
    category: AssetCategory.DIGITAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "₿",
    description: "Bitcoin, Ethereum, and other digital currencies",
    requiredFields: ["cryptocurrency_type", "wallet_type"],
    optionalFields: ["wallet_address", "exchange_name", "amount_held"],
  },
  [DigitalAssetType.DOMAIN_NAMES]: {
    name: "Domain Names",
    category: AssetCategory.DIGITAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "🌐",
    description: "Website domains and online properties",
    requiredFields: ["domain_name"],
    optionalFields: ["registrar", "expiry_date", "annual_revenue"],
  },
  [DigitalAssetType.ONLINE_ACCOUNTS]: {
    name: "Online Accounts",
    category: AssetCategory.DIGITAL,
    jurisdiction: JurisdictionCode.IE,
    icon: "💻",
    description:
      "Social media accounts, content platforms, and digital businesses",
    requiredFields: ["platform_name", "account_type"],
    optionalFields: [
      "follower_count",
      "monetization_enabled",
      "estimated_monthly_earnings",
    ],
  },
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export const getAssetTypesByCategory = (
  category: AssetCategory,
): AssetType[] => {
  return AssetCategoryDefinitions[category]?.types || [];
};

export const getAssetTypeDefinition = (assetType: AssetType) => {
  return AssetTypeDefinitions[assetType as keyof typeof AssetTypeDefinitions];
};

export const getSchemaForAssetType = (assetType: AssetType) => {
  switch (assetType) {
    // Financial Assets
    case FinancialAssetType.IRISH_BANK_ACCOUNT:
      return IrishBankAccountSchema;
    case FinancialAssetType.INDIVIDUAL_STOCK_HOLDING:
      return IndividualStockHoldingSchema;
    case FinancialAssetType.IRISH_PRSA:
      return IrishPRSASchema;

    // Property Assets
    case PropertyAssetType.IRISH_RESIDENTIAL_PROPERTY:
      return IrishResidentialPropertySchema;
    case PropertyAssetType.IRISH_COMMERCIAL_PROPERTY:
      return IrishCommercialPropertySchema;
    case PropertyAssetType.IRISH_AGRICULTURAL_LAND:
      return IrishAgriculturalLandSchema;

    // Business Assets
    case BusinessAssetType.IRISH_LIMITED_COMPANY_SHARES:
      return IrishCompanySharesSchema;
    case BusinessAssetType.IRISH_SOLE_TRADER_BUSINESS:
      return IrishSoleTraderBusinessSchema;
    case BusinessAssetType.IRISH_INTELLECTUAL_PROPERTY:
      return IrishIntellectualPropertySchema;

    // Personal Assets
    case PersonalAssetType.IRISH_MOTOR_VEHICLE:
      return IrishMotorVehicleSchema;
    case PersonalAssetType.JEWELRY:
      return JewelrySchema;
    case PersonalAssetType.ART_COLLECTIBLES:
      return ArtCollectiblesSchema;
    case PersonalAssetType.ELECTRONICS:
      return ElectronicsSchema;

    // Digital Assets
    case DigitalAssetType.CRYPTOCURRENCY:
      return CryptocurrencySchema;
    case DigitalAssetType.DOMAIN_NAMES:
      return DomainNamesSchema;
    case DigitalAssetType.ONLINE_ACCOUNTS:
      return OnlineAccountsSchema;

    default:
      throw new Error(`No schema defined for asset type: ${assetType}`);
  }
};

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
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// =====================================================
// LEGACY COMPATIBILITY
// =====================================================

// For backward compatibility with existing database schema
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

// Legacy interface for irish_fields compatibility
export interface IrishAssetFields {
  iban?: string;
  bic_swift?: string;
  irish_bank_name?: IrishBankName;
  irish_account_type?: IrishAccountType;
  eircode?: string;
  property_type?: IrishPropertyType;
  // Add other fields as needed for backward compatibility
}

// Legacy form data type for existing components
export interface LegacyAssetFormData {
  name: string;
  asset_type: AssetType;
  category: AssetCategory;
  jurisdiction: JurisdictionCode;
  value: number;
  currency: CurrencyCode;
  description?: string;
  irish_fields?: IrishAssetFields;
  notes?: string;
}

// Legacy alias - will be deprecated
export const IrishAssetFormSchema = z.object({
  name: z.string().min(1, "Asset name is required").max(255, "Name too long"),
  asset_type: z.union([
    z.nativeEnum(FinancialAssetType),
    z.nativeEnum(PropertyAssetType),
    z.nativeEnum(BusinessAssetType),
    z.nativeEnum(PersonalAssetType),
    z.nativeEnum(DigitalAssetType),
  ]),
  category: z.nativeEnum(AssetCategory),
  jurisdiction: z.nativeEnum(JurisdictionCode).default(JurisdictionCode.IE),
  value: z
    .number()
    .min(0, "Value must be positive")
    .max(999999999, "Value too large"),
  currency: z.nativeEnum(CurrencyCode).default(CurrencyCode.EUR),
  description: z.string().max(1000, "Description too long").optional(),
  irish_fields: z
    .object({
      iban: z.string().optional(),
      bic_swift: z.string().optional(),
      irish_bank_name: z.nativeEnum(IrishBankName).optional(),
      irish_account_type: z.nativeEnum(IrishAccountType).optional(),
      eircode: z.string().optional(),
      property_type: z.nativeEnum(IrishPropertyType).optional(),
    })
    .optional(),
  notes: z.string().max(2000).optional(),
});

export type AssetFormDataType = z.infer<typeof IrishAssetFormSchema>;

// Alias for backward compatibility
export const IrishAssetTypeDefinitions = AssetTypeDefinitions;

// Helper to get all asset type values
export const getAllAssetTypes = (): AssetType[] => {
  return [
    ...Object.values(FinancialAssetType),
    ...Object.values(PropertyAssetType),
    ...Object.values(BusinessAssetType),
    ...Object.values(PersonalAssetType),
    ...Object.values(DigitalAssetType),
  ];
};
