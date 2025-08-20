import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { documentStorage } from "@/lib/document-storage";

// GET /api/documents/[id] - Get a specific document URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const documentId = resolvedParams.id;
    const url = await documentStorage.getDocumentUrl(
      documentId,
      session.user.email,
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Get document error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get document",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    await documentStorage.deleteDocument(documentId, session.user.email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete document",
      },
      { status: 500 },
    );
  }
}
