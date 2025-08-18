import { NextRequest, NextResponse } from "next/server";
import { eq, desc, asc, like, and, or } from "drizzle-orm";

import { db } from "@/db/db";
import { assets } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { IrishAssetFormSchema, AssetCategory, AssetType } from "@/types/assets";

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
      const categoryTypes = Object.values(AssetType).filter((type) => {
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

    // Add status filter
    if (status) {
      whereConditions.push(eq(assets.status, status));
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

    // Calculate summary statistics
    const totalValue = userAssets.reduce(
      (sum, asset) => sum + (asset.value || 0),
      0,
    );
    const assetCount = userAssets.length;
    const categoryBreakdown = userAssets.reduce(
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

    // Validate input data
    const validationResult = IrishAssetFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const assetData = validationResult.data;

    // Create asset in database
    const newAsset = await db
      .insert(assets)
      .values({
        user_email: session.user.email,
        name: assetData.name,
        asset_type: assetData.asset_type,
        value: assetData.value,
        description: assetData.description,
        account_number: assetData.irish_fields?.iban || null,
        bank_name: assetData.irish_fields?.irish_bank_name || null,
        property_address: assetData.irish_fields?.eircode
          ? `${assetData.irish_fields.eircode}, ${assetData.irish_fields.property_type || ""}`
          : null,
        status: "active",
      })
      .returning();

    // Log asset creation for audit trail
    console.log(
      `Asset created: ${newAsset[0].id} by user ${session.user.email}`,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Asset created successfully",
        data: newAsset[0],
      },
      { status: 201 },
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
