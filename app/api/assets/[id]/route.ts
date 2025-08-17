import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { db } from "@/db/db";
import { assets } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { AssetFormSchema } from "@/types/assets";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const assetId = params.id;

    // Fetch the specific asset
    const asset = await db
      .select()
      .from(assets)
      .where(
        and(eq(assets.id, assetId), eq(assets.user_email, session.user.email)),
      )
      .limit(1);

    if (asset.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: asset[0],
    });
  } catch (error) {
    console.error("Asset fetch error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const assetId = params.id;
    const body = await request.json();

    // Validate input data
    const validationResult = AssetFormSchema.safeParse(body);

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
      .where(
        and(eq(assets.id, assetId), eq(assets.user_email, session.user.email)),
      )
      .limit(1);

    if (existingAsset.length === 0) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Update asset in database
    const updatedAsset = await db
      .update(assets)
      .set({
        name: assetData.name,
        asset_type: assetData.asset_type,
        value: assetData.value,
        description: assetData.description,
        account_number: assetData.account_number,
        bank_name: assetData.bank_name || assetData.institution_name,
        property_address: assetData.property_address,
        updated_at: new Date(),
      })
      .where(
        and(eq(assets.id, assetId), eq(assets.user_email, session.user.email)),
      )
      .returning();

    // Log asset update for audit trail
    console.log(`Asset updated: ${assetId} by user ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: "Asset updated successfully",
      data: updatedAsset[0],
    });
  } catch (error) {
    console.error("Asset update error:", error);

    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const assetId = params.id;

    // Check if asset exists and belongs to user
    const existingAsset = await db
      .select()
      .from(assets)
      .where(
        and(eq(assets.id, assetId), eq(assets.user_email, session.user.email)),
      )
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
      .where(
        and(eq(assets.id, assetId), eq(assets.user_email, session.user.email)),
      );

    // Log asset deletion for audit trail
    console.log(`Asset deleted: ${assetId} by user ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: "Asset deleted successfully",
    });
  } catch (error) {
    console.error("Asset deletion error:", error);

    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
