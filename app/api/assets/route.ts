import { NextRequest, NextResponse } from "next/server";
import { eq, desc, asc, like, and, or } from "drizzle-orm";

import { db } from "@/db/db";
import { assets } from "@/db/schema";
import { getSession } from "@/lib/auth";
import {
  AssetFormSchema,
  AssetCategory,
  getAllAssetTypes,
} from "@/types/assets";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const assetType = searchParams.get("asset_type") || "";
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = searchParams.get("sort_order") || "desc";
    const status = searchParams.get("status") || "";

    // Build where conditions
    const whereConditions = [eq(assets.user_email, session.user.email)];

    // Add status filter - default to active only
    if (status) {
      whereConditions.push(eq(assets.status, status));
    } else {
      whereConditions.push(eq(assets.status, "active")); // Only show active assets by default
    }

    // Add search filter
    if (search) {
      whereConditions.push(
        or(
          like(assets.name, `%${search}%`),
          like(assets.description, `%${search}%`),
          like(assets.bank_name, `%${search}%`),
          like(assets.property_address, `%${search}%`),
        )!,
      );
    }

    // Add category filter (derived from asset_type)
    if (category) {
      const categoryTypes = getAllAssetTypes().filter((type) => {
        // This would need to be enhanced with proper category mapping
        return type.includes(category.toLowerCase());
      });

      if (categoryTypes.length > 0) {
        whereConditions.push(
          or(...categoryTypes.map((type) => eq(assets.asset_type, type)))!,
        );
      }
    }

    // Add asset type filter
    if (assetType) {
      whereConditions.push(eq(assets.asset_type, assetType));
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Determine sort order
    const getOrderByColumn = () => {
      switch (sortBy) {
        case "name":
          return assets.name;
        case "value":
          return assets.value;
        case "asset_type":
          return assets.asset_type;
        case "created_at":
        default:
          return assets.created_at;
      }
    };

    const orderBy =
      sortOrder === "desc" ? desc(getOrderByColumn()) : asc(getOrderByColumn());

    // Fetch assets with pagination
    const userAssets = await db
      .select()
      .from(assets)
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: assets.id })
      .from(assets)
      .where(and(...whereConditions));

    const totalCount = totalCountResult.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate summary statistics from ALL active user assets (not just paginated results)
    const allUserAssets = await db
      .select({
        value: assets.value,
        asset_type: assets.asset_type,
      })
      .from(assets)
      .where(
        and(
          eq(assets.user_email, session.user.email),
          eq(assets.status, "active"),
        ),
      );

    const totalValue = allUserAssets.reduce(
      (sum, asset) => sum + (asset.value || 0),
      0,
    );
    const assetCount = allUserAssets.length;
    const categoryBreakdown = allUserAssets.reduce(
      (acc, asset) => {
        const category = getCategoryFromAssetType(asset.asset_type);

        acc[category] = (acc[category] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>,
    );

    return NextResponse.json({
      success: true,
      data: {
        assets: userAssets,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        summary: {
          totalValue,
          assetCount,
          categoryBreakdown,
        },
      },
    });
  } catch (error) {
    console.error("Assets fetch error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Try V2 schema first (discriminated union)
    const v2ValidationResult = AssetFormSchema.safeParse(body);

    if (v2ValidationResult.success) {
      // Handle V2 asset creation
      const assetData = v2ValidationResult.data;

      // Extract key fields from specific_fields for legacy database compatibility
      const specificFields = assetData.specific_fields || {};

      // Type-safe field extraction based on asset type
      let accountNumber: string | null = null;
      let bankName: string | null = null;
      let propertyAddress: string | null = null;

      // Extract fields based on specific asset type
      if ("iban" in specificFields) {
        accountNumber = specificFields.iban as string;
      } else if ("account_number" in specificFields) {
        accountNumber = specificFields.account_number as string;
      }

      if ("irish_bank_name" in specificFields) {
        bankName = specificFields.irish_bank_name as string;
      } else if ("company_name" in specificFields) {
        bankName = specificFields.company_name as string;
      } else if ("business_name" in specificFields) {
        bankName = specificFields.business_name as string;
      }

      if ("eircode" in specificFields) {
        const propertyType =
          "property_type" in specificFields
            ? (specificFields.property_type as string)
            : "";

        propertyAddress = `${specificFields.eircode as string}, ${propertyType}`;
      } else if ("domain_name" in specificFields) {
        propertyAddress = specificFields.domain_name as string;
      }

      const newAsset = await db
        .insert(assets)
        .values({
          user_email: session.user.email,
          name: assetData.name,
          asset_type: assetData.asset_type,
          value: assetData.value,
          description: assetData.description,
          account_number: accountNumber,
          bank_name: bankName,
          property_address: propertyAddress,
          status: "active",
        })
        .returning();

      console.log(
        `V2 Asset created: ${newAsset[0].id} by user ${session.user.email}`,
      );

      return NextResponse.json(
        {
          success: true,
          message: "Asset created successfully (V2 Schema)",
          data: newAsset[0],
          schema_version: "v2",
        },
        { status: 201 },
      );
    }

    // Fallback error response
    return NextResponse.json(
      {
        error: "Validation failed",
        details: v2ValidationResult.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Asset creation error:", error);

    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 },
    );
  }
}

// Helper function to map asset types to categories
function getCategoryFromAssetType(assetType: string): string {
  const financialTypes = [
    "bank_account",
    "savings_account",
    "investment_account",
    "pension",
    "shares",
    "bonds",
    "cryptocurrency",
  ];
  const propertyTypes = [
    "residential_property",
    "commercial_property",
    "land",
    "rental_property",
  ];
  const personalTypes = [
    "vehicle",
    "jewelry",
    "art",
    "collectibles",
    "furniture",
    "electronics",
  ];
  const businessTypes = [
    "business_shares",
    "intellectual_property",
    "business_equipment",
  ];
  const digitalTypes = [
    "digital_currency",
    "online_accounts",
    "digital_files",
    "domain_names",
  ];

  if (financialTypes.includes(assetType)) return AssetCategory.FINANCIAL;
  if (propertyTypes.includes(assetType)) return AssetCategory.PROPERTY;
  if (personalTypes.includes(assetType)) return AssetCategory.PERSONAL;
  if (businessTypes.includes(assetType)) return AssetCategory.BUSINESS;
  if (digitalTypes.includes(assetType)) return AssetCategory.DIGITAL;

  return AssetCategory.PERSONAL; // Default fallback
}

export const dynamic = "force-dynamic";
