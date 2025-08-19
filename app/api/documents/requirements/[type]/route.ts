import { NextRequest, NextResponse } from "next/server";
import { getDocumentRequirements } from "@/data/irish-document-requirements";

// GET /api/documents/requirements/[type] - Get document requirements for an asset type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const resolvedParams = await params;
    const assetType = resolvedParams.type;
    const requirements = getDocumentRequirements(assetType);

    return NextResponse.json({
      assetType,
      ...requirements,
      total: {
        required: requirements.required.length,
        recommended: requirements.recommended.length,
        optional: requirements.optional.length,
      },
    });
  } catch (error) {
    console.error("Get requirements error:", error);
    return NextResponse.json(
      { error: "Failed to get document requirements" },
      { status: 500 }
    );
  }
}