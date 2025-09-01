import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { getSession } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type (images only)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 },
      );
    }

    // Generate unique pathname for blob storage
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const userEmail = session.user.email.replace(/[^a-zA-Z0-9.-]/g, "_");
    const pathname = `beneficiaries/photos/${userEmail}/${timestamp}-${sanitizedFileName}`;

    try {
      // Upload to Vercel Blob
      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: false,
      });

      return NextResponse.json(
        {
          success: true,
          url: blob.url,
          pathname: pathname,
          filename: sanitizedFileName,
          size: file.size,
        },
        { status: 201 },
      );
    } catch (uploadError) {
      console.error("Blob upload error:", uploadError);

      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Photo upload error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
