import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  AssetCategory,
  AssetType,
  AssetCategoryDefinitions,
  AssetTypeDefinitions,
  CurrencyOptions,
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

    // Return all category and type definitions for forms
    return NextResponse.json({
      success: true,
      data: {
        categories: AssetCategoryDefinitions,
        types: AssetTypeDefinitions,
        currencies: CurrencyOptions,
        enums: {
          AssetCategory,
          AssetType,
        },
      },
    });
  } catch (error) {
    console.error("Asset categories fetch error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
