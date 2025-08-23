import { NextRequest, NextResponse } from "next/server";
import { eq, desc, asc, like, and, or } from "drizzle-orm";

import { db } from "@/db/db";
import { assets, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { AssetFormSchema, AssetType } from "@/types/assets";
import {
  mapAssetTypeToCategory,
  isValidAssetCategory,
} from "@/lib/asset-type-utils";

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

    // Get user ID from email
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build where conditions
    const whereConditions = [eq(assets.user_id, user.id)];

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
    if (category && isValidAssetCategory(category)) {
      whereConditions.push(eq(assets.asset_type, category));
    }

    // Add asset type filter - if it's a detailed type, map to category
    if (assetType) {
      const categoryType = isValidAssetCategory(assetType)
        ? assetType
        : mapAssetTypeToCategory(assetType as any);

      whereConditions.push(eq(assets.asset_type, categoryType));
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
      .where(and(eq(assets.user_id, user.id), eq(assets.status, "active")));

    const totalValue = allUserAssets.reduce(
      (sum, asset) => sum + (asset.value || 0),
      0,
    );
    const assetCount = allUserAssets.length;
    const categoryBreakdown = allUserAssets.reduce(
      (acc, asset) => {
        const category = mapAssetTypeToCategory(asset.asset_type as AssetType);

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

    // Get user ID from email
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

      // Map detailed asset type to category for database storage
      const assetCategory = mapAssetTypeToCategory(assetData.asset_type);

      const newAsset = await db
        .insert(assets)
        .values({
          user_id: user.id,
          name: assetData.name,
          asset_type: assetCategory,
          value: assetData.value,
          description: assetData.description,
          account_number: accountNumber,
          bank_name: bankName,
          property_address: propertyAddress,
          status: "active",
        })
        .returning();

      // Asset created successfully

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
    // Log error internally

    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
