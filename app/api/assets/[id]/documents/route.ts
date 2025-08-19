import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { documentStorage } from "@/lib/document-storage";
import { DocumentUploadSchema } from "@/types/documents";
import { z } from "zod";

// POST /api/assets/[id]/documents - Upload a document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== Document upload POST request ===");
    const session = await getSession();
    console.log("Session:", session?.user?.email);
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const assetId = resolvedParams.id;
    console.log("Asset ID:", assetId);
    
    const formData = await request.formData();
    console.log("Form data keys:", Array.from(formData.keys()));
    
    // Get file from form data
    const file = formData.get("file") as File;
    console.log("File:", file?.name, file?.size, file?.type);
    if (!file) {
      console.log("No file provided");
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Parse and validate metadata
    const metadata = {
      assetId,
      category: formData.get("category") as string,
      documentType: formData.get("documentType") as string,
      description: formData.get("description") as string || undefined,
      issueDate: formData.get("issueDate") as string || undefined,
      expiryDate: formData.get("expiryDate") as string || undefined,
    };
    console.log("Metadata:", metadata);

    // Validate required fields first
    if (!metadata.category) {
      return NextResponse.json(
        { error: "Document category is required" },
        { status: 400 }
      );
    }

    if (!metadata.documentType) {
      return NextResponse.json(
        { error: "Document type is required" },
        { status: 400 }
      );
    }

    // Validate dates if provided
    if (metadata.issueDate && isNaN(new Date(metadata.issueDate).getTime())) {
      return NextResponse.json(
        { error: "Invalid issue date format" },
        { status: 400 }
      );
    }

    if (metadata.expiryDate && isNaN(new Date(metadata.expiryDate).getTime())) {
      return NextResponse.json(
        { error: "Invalid expiry date format" },
        { status: 400 }
      );
    }

    const validationResult = DocumentUploadSchema.safeParse(metadata);
    console.log("Validation result:", validationResult.success);
    if (!validationResult.success) {
      console.log("Validation errors:", validationResult.error.flatten());
      
      // Create user-friendly error messages
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const errorMessages: string[] = [];
      
      if (fieldErrors.category) {
        errorMessages.push("Please select a valid document category");
      }
      if (fieldErrors.documentType) {
        errorMessages.push("Please specify a document type");
      }
      if (fieldErrors.assetId) {
        errorMessages.push("Invalid asset ID");
      }
      if (fieldErrors.issueDate) {
        errorMessages.push("Issue date format is invalid");
      }
      if (fieldErrors.expiryDate) {
        errorMessages.push("Expiry date format is invalid");
      }

      const errorMessage = errorMessages.length > 0 
        ? errorMessages.join(". ") 
        : "Invalid document metadata";

      return NextResponse.json(
        { 
          error: errorMessage,
          details: fieldErrors 
        },
        { status: 400 }
      );
    }

    // Upload document
    try {
      const document = await documentStorage.uploadDocument(
        file,
        assetId,
        session.user.email,
        validationResult.data
      );

      console.log("✅ Document uploaded successfully:", document.id);
      return NextResponse.json(document);
    } catch (uploadError) {
      console.error("❌ Document upload error:", uploadError);
      
      // Handle specific error types
      if (uploadError instanceof Error) {
        const errorMessage = uploadError.message;
        
        // Check for common database constraint errors
        if (errorMessage.includes("violates foreign key constraint")) {
          return NextResponse.json(
            { error: "Asset not found or access denied" },
            { status: 403 }
          );
        }
        
        if (errorMessage.includes("File type") && errorMessage.includes("not allowed")) {
          return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
          );
        }
        
        if (errorMessage.includes("File size exceeds")) {
          return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
          );
        }
        
        if (errorMessage.includes("Storage quota exceeded")) {
          return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
          );
        }
        
        if (errorMessage.includes("Maximum number of documents")) {
          return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
          );
        }
      }
      
      // Generic error response
      return NextResponse.json(
        { error: "Failed to upload document. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Unexpected error in document upload:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// GET /api/assets/[id]/documents - Get documents for an asset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const assetId = resolvedParams.id;
    const searchParams = request.nextUrl.searchParams;
    
    // Build filter from query params
    const filter = {
      category: searchParams.get("category") || undefined,
      documentType: searchParams.get("type") || undefined,
      searchTerm: searchParams.get("search") || undefined,
    };

    const documents = await documentStorage.getAssetDocuments(
      assetId,
      session.user.email,
      filter as any
    );

    // Get document completeness
    const assetTypeParam = searchParams.get("assetType");
    let completeness = null;
    if (assetTypeParam) {
      completeness = await documentStorage.getDocumentCompleteness(
        assetId,
        assetTypeParam
      );
    }

    return NextResponse.json({
      documents,
      completeness,
      total: documents.length,
    });
  } catch (error) {
    console.error("Get documents error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get documents" },
      { status: 500 }
    );
  }
}