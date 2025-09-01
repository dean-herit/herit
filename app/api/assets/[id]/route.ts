import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { db } from "@/db/db";
import { assets, users } from "@/db/schema";
import { getSession } from "@/app/lib/auth";
import { IrishAssetFormSchema } from "@/app/types/assets";
import { mapAssetTypeToCategory } from "@/app/lib/asset-type-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id: assetId } = await params;

    // Get user ID from email
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch the specific asset
    const asset = await db
      .select()
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.user_id, user.id)))
      .limit(1);

    if (asset.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: asset[0],
    });
  } catch (error) {
    // Log error internally

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id: assetId } = await params;
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

    // Check if asset exists and belongs to user
    const existingAsset = await db
      .select()
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.user_id, user.id)))
      .limit(1);

    if (existingAsset.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Map detailed asset type to category for database storage
    const assetCategory = mapAssetTypeToCategory(assetData.asset_type);

    // Update asset in database
    const updatedAsset = await db
      .update(assets)
      .set({
        name: assetData.name,
        asset_type: assetCategory,
        value: assetData.value,
        description: assetData.description,
        account_number:
          assetData.irish_fields?.iban || existingAsset[0].account_number,
        bank_name:
          assetData.irish_fields?.irish_bank_name || existingAsset[0].bank_name,
        property_address: assetData.irish_fields?.eircode
          ? `${assetData.irish_fields.eircode}, ${assetData.irish_fields.property_type || ""}`
          : existingAsset[0].property_address,
        updated_at: new Date(),
      })
      .where(and(eq(assets.id, assetId), eq(assets.user_id, user.id)))
      .returning();

    // Asset updated successfully

    return NextResponse.json({
      success: true,
      message: "Asset updated successfully",
      data: updatedAsset[0],
    });
  } catch (error) {
    // Log error internally

    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id: assetId } = await params;

    // Get user ID from email
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if asset exists and belongs to user
    const existingAsset = await db
      .select()
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.user_id, user.id)))
      .limit(1);

    if (existingAsset.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Soft delete by updating status instead of hard delete
    // This preserves audit trail and allows for recovery
    await db
      .update(assets)
      .set({
        status: "inactive",
        updated_at: new Date(),
      })
      .where(and(eq(assets.id, assetId), eq(assets.user_id, user.id)));

    // Asset deleted successfully

    return NextResponse.json({
      success: true,
      message: "Asset deleted successfully",
    });
  } catch (error) {
    // Log error internally

    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
