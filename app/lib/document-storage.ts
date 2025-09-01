/**
 * Document Storage and Management Library
 * Handles file storage, validation, and Irish document requirements
 */

import { put, del, list } from "@vercel/blob";

import { getDocumentRequirements } from "@/data/irish-document-requirements";

export enum DocumentPriority {
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
  OPTIONAL = 4,
}

export interface StoredDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  description?: string;
  url: string;
  uploadedAt: Date;
  userId: string;
}

export interface DocumentUploadOptions {
  fileName: string;
  fileType: string;
  category: string;
  description?: string;
  userId: string;
}

export class DocumentStorageService {
  private static instance: DocumentStorageService;

  public static getInstance(): DocumentStorageService {
    if (!DocumentStorageService.instance) {
      DocumentStorageService.instance = new DocumentStorageService();
    }

    return DocumentStorageService.instance;
  }

  /**
   * Get document priority based on asset type and document type
   */
  getDocumentPriority(
    assetType: string,
    documentType: string,
  ): DocumentPriority {
    try {
      const requirements = getDocumentRequirements(assetType);
      const allRequirements = [
        ...requirements.required,
        ...requirements.recommended,
        ...requirements.optional,
      ];
      const requirement = allRequirements.find(
        (req) => req.category === documentType,
      );

      return (
        (requirement?.priority as DocumentPriority) || DocumentPriority.OPTIONAL
      );
    } catch {
      return DocumentPriority.OPTIONAL;
    }
  }

  /**
   * Upload document to Vercel Blob storage
   */
  async uploadDocument(
    file: File | Buffer,
    options: DocumentUploadOptions,
  ): Promise<StoredDocument> {
    try {
      const fileName = `${options.userId}/${Date.now()}-${options.fileName}`;

      const blob = await put(fileName, file, {
        access: "public",
        addRandomSuffix: false,
      });

      const document: StoredDocument = {
        id: blob.pathname,
        fileName: options.fileName,
        fileType: options.fileType,
        fileSize: file instanceof File ? file.size : file.length,
        category: options.category,
        description: options.description,
        url: blob.url,
        uploadedAt: new Date(),
        userId: options.userId,
      };

      return document;
    } catch (error) {
      console.error("Document upload failed:", error);
      throw new Error("Failed to upload document");
    }
  }

  /**
   * Delete document from storage
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await del(documentId);
    } catch (error) {
      console.error("Document deletion failed:", error);
      throw new Error("Failed to delete document");
    }
  }

  /**
   * List documents for a user
   */
  async listUserDocuments(userId: string): Promise<StoredDocument[]> {
    try {
      const { blobs } = await list({
        prefix: `${userId}/`,
      });

      return blobs.map((blob) => ({
        id: blob.pathname,
        fileName: blob.pathname.split("/").pop() || "",
        fileType: "application/octet-stream", // contentType not available in current Vercel Blob API
        fileSize: blob.size,
        category: "unknown", // Would be stored in database
        url: blob.url,
        uploadedAt: blob.uploadedAt,
        userId,
      }));
    } catch (error) {
      console.error("Failed to list documents:", error);
      throw new Error("Failed to list documents");
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: "File size must be less than 10MB",
      };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error:
          "File type not supported. Please upload PDF, Word, or image files.",
      };
    }

    return { isValid: true };
  }

  /**
   * Get required documents for an asset type
   */
  getRequiredDocumentsForAsset(assetType: string) {
    return getDocumentRequirements(assetType);
  }

  /**
   * Check if all required documents are uploaded
   */
  checkDocumentCompleteness(
    assetType: string,
    uploadedDocuments: string[],
  ): {
    isComplete: boolean;
    missing: string[];
    recommended: string[];
  } {
    const requirements = getDocumentRequirements(assetType);
    const requiredCategories = requirements.required.map((req) => req.category);
    const recommendedCategories = requirements.recommended.map(
      (req) => req.category,
    );

    const missing = requiredCategories.filter(
      (category) => !uploadedDocuments.includes(category),
    );

    const missingRecommended = recommendedCategories.filter(
      (category) => !uploadedDocuments.includes(category),
    );

    return {
      isComplete: missing.length === 0,
      missing,
      recommended: missingRecommended,
    };
  }

  /**
   * Get documents for a specific asset
   */
  async getAssetDocuments(assetId: string): Promise<StoredDocument[]> {
    try {
      // This would typically query a database for documents by asset ID
      // For now, return empty array as this requires database integration
      return [];
    } catch (error) {
      console.error("Failed to get asset documents:", error);
      throw new Error("Failed to get asset documents");
    }
  }

  /**
   * Get document URL by ID
   */
  async getDocumentUrl(documentId: string): Promise<string> {
    try {
      // For Vercel Blob, the document ID is typically the pathname
      // and the URL can be constructed or retrieved from storage
      // This is a placeholder implementation
      return `https://example.blob.vercel-storage.com/${documentId}`;
    } catch (error) {
      console.error("Failed to get document URL:", error);
      throw new Error("Failed to get document URL");
    }
  }
}

// Export singleton instance
export const documentStorage = DocumentStorageService.getInstance();
