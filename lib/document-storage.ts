import { put, del } from "@vercel/blob";
import { eq, and, count, sum, desc, max, ilike } from "drizzle-orm";

import { db } from "@/db/db";
import {
  assetDocuments,
  documentAuditLog,
  documentRequirements,
  assets,
  type NewAssetDocument,
  type NewDocumentAuditLog,
} from "@/db/schema";
import {
  DocumentMetadata,
  DocumentUpload,
  DocumentFilter,
  DocumentStats,
  DocumentStatus,
  DocumentPriority,
  DocumentCategory,
  validateFileType,
  validateFileSize,
  MAX_FILES_PER_ASSET,
  MAX_TOTAL_STORAGE_PER_USER,
} from "@/types/documents";
import { getDocumentRequirements } from "@/data/irish-document-requirements";

export class DocumentStorageService {
  /**
   * Helper method to determine document priority based on asset type requirements
   */
  private getDocumentPriority(
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
        (req) => req.documentType === documentType,
      );

      return requirement?.priority || DocumentPriority.OPTIONAL;
    } catch {
      return DocumentPriority.OPTIONAL;
    }
  }

  /**
   * Helper method to determine document status
   */
  private getDocumentStatus(expiryDate?: Date): DocumentStatus {
    if (!expiryDate) {
      return DocumentStatus.UPLOADED;
    }

    const now = new Date();

    if (expiryDate < now) {
      return DocumentStatus.EXPIRED;
    }

    return DocumentStatus.UPLOADED;
  }

  /**
   * Upload a document to Vercel Blob storage and save metadata to database
   */
  async uploadDocument(
    file: File,
    assetId: string,
    userEmail: string,
    metadata: DocumentUpload,
  ): Promise<DocumentMetadata> {
    // Validate file
    if (!validateFileType(file)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    if (!validateFileSize(file)) {
      throw new Error(`File size exceeds maximum allowed size`);
    }

    // Get asset information to determine document priority
    const asset = await db
      .select({ asset_type: assets.asset_type })
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.user_email, userEmail)))
      .limit(1);

    if (asset.length === 0) {
      throw new Error("Asset not found or access denied");
    }

    const assetType = asset[0].asset_type;

    // Check document count for asset
    const documentCount = await db
      .select({ count: count() })
      .from(assetDocuments)
      .where(eq(assetDocuments.asset_id, assetId));

    if (documentCount[0].count >= MAX_FILES_PER_ASSET) {
      throw new Error(
        `Maximum number of documents (${MAX_FILES_PER_ASSET}) reached for this asset`,
      );
    }

    // Check user storage quota
    const totalStorageResult = await db
      .select({ total_size: sum(assetDocuments.file_size) })
      .from(assetDocuments)
      .where(eq(assetDocuments.user_email, userEmail));

    const currentStorageUsed = Number(totalStorageResult[0].total_size) || 0;

    if (currentStorageUsed + file.size > MAX_TOTAL_STORAGE_PER_USER) {
      throw new Error(
        "Storage quota exceeded. Please delete some documents before uploading new ones.",
      );
    }

    // Generate unique pathname for blob storage
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const pathname = `documents/${userEmail}/${assetId}/${timestamp}-${sanitizedFileName}`;

    try {
      // Upload to Vercel Blob
      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: false,
      });

      // Save metadata to database using Drizzle
      const newDocument: NewAssetDocument = {
        asset_id: assetId,
        user_email: userEmail,
        file_name: sanitizedFileName,
        original_name: file.name,
        file_type: file.type.split("/")[1] || "unknown",
        file_size: file.size,
        mime_type: file.type,
        blob_url: blob.url,
        blob_pathname: pathname,
        blob_download_url: blob.downloadUrl || blob.url,
        document_category: metadata.category,
        document_type: metadata.documentType,
        description: metadata.description || null,
        expiry_date: metadata.expiryDate || null,
        issue_date: metadata.issueDate || null,
      };

      const result = await db
        .insert(assetDocuments)
        .values(newDocument)
        .returning();

      // Log the upload action
      await this.logDocumentAction(result[0].id, userEmail, "upload");

      // Map database result to TypeScript interface
      const dbDocument = result[0];
      const expiryDate = dbDocument.expiry_date
        ? new Date(dbDocument.expiry_date)
        : undefined;

      const documentMetadata: DocumentMetadata = {
        id: dbDocument.id,
        assetId: dbDocument.asset_id,
        userEmail: dbDocument.user_email,
        fileName: dbDocument.file_name,
        originalName: dbDocument.original_name,
        fileType: dbDocument.file_type,
        fileSize: dbDocument.file_size,
        mimeType: dbDocument.mime_type,
        blobUrl: dbDocument.blob_url,
        blobPathname: dbDocument.blob_pathname,
        blobDownloadUrl: dbDocument.blob_download_url || undefined,
        category: dbDocument.document_category as DocumentCategory,
        documentType: dbDocument.document_type,
        priority: this.getDocumentPriority(assetType, dbDocument.document_type),
        status: this.getDocumentStatus(expiryDate),
        description: dbDocument.description || undefined,
        expiryDate: expiryDate,
        issueDate: dbDocument.issue_date
          ? new Date(dbDocument.issue_date)
          : undefined,
        uploadedAt: new Date(dbDocument.uploaded_at!),
        createdAt: new Date(dbDocument.created_at!),
        updatedAt: new Date(dbDocument.updated_at!),
      };

      return documentMetadata;
    } catch (error) {
      // If database insert fails, try to clean up the blob
      try {
        await del(pathname);
      } catch (delError) {
        console.error("Failed to clean up blob after error:", delError);
      }
      throw error;
    }
  }

  /**
   * Delete a document from storage and database
   */
  async deleteDocument(documentId: string, userEmail: string): Promise<void> {
    // Get document details
    const documents = await db
      .select({
        blob_pathname: assetDocuments.blob_pathname,
        user_email: assetDocuments.user_email,
      })
      .from(assetDocuments)
      .where(eq(assetDocuments.id, documentId))
      .limit(1);

    if (documents.length === 0) {
      throw new Error("Document not found");
    }

    if (documents[0].user_email !== userEmail) {
      throw new Error("Unauthorized to delete this document");
    }

    const pathname = documents[0].blob_pathname;

    try {
      // Delete from blob storage
      await del(pathname);

      // Delete from database (cascade will handle audit log)
      await db.delete(assetDocuments).where(eq(assetDocuments.id, documentId));

      // Log the deletion
      await this.logDocumentAction(documentId, userEmail, "delete");
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  }

  /**
   * Get documents for an asset
   */
  async getAssetDocuments(
    assetId: string,
    userEmail: string,
    filter?: DocumentFilter,
  ): Promise<DocumentMetadata[]> {
    // Verify user owns the asset
    const assetCheck = await db
      .select({ id: assets.id })
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.user_email, userEmail)))
      .limit(1);

    if (assetCheck.length === 0) {
      throw new Error("Asset not found or unauthorized");
    }

    // Build query with filters
    let whereClause = eq(assetDocuments.asset_id, assetId);

    if (filter) {
      const conditions = [whereClause];

      if (filter.category) {
        conditions.push(eq(assetDocuments.document_category, filter.category));
      }

      if (filter.documentType) {
        conditions.push(eq(assetDocuments.document_type, filter.documentType));
      }

      if (filter.searchTerm) {
        conditions.push(
          ilike(assetDocuments.file_name, `%${filter.searchTerm}%`),
        );
      }

      if (conditions.length > 1) {
        whereClause = and(...conditions) as any;
      } else if (conditions.length === 1) {
        whereClause = conditions[0]!;
      }
    }

    // Query with asset type join to determine priority
    const documents = await db
      .select({
        // Document fields
        id: assetDocuments.id,
        asset_id: assetDocuments.asset_id,
        user_email: assetDocuments.user_email,
        file_name: assetDocuments.file_name,
        original_name: assetDocuments.original_name,
        file_type: assetDocuments.file_type,
        file_size: assetDocuments.file_size,
        mime_type: assetDocuments.mime_type,
        blob_url: assetDocuments.blob_url,
        blob_pathname: assetDocuments.blob_pathname,
        blob_download_url: assetDocuments.blob_download_url,
        document_category: assetDocuments.document_category,
        document_type: assetDocuments.document_type,
        description: assetDocuments.description,
        expiry_date: assetDocuments.expiry_date,
        issue_date: assetDocuments.issue_date,
        uploaded_at: assetDocuments.uploaded_at,
        created_at: assetDocuments.created_at,
        updated_at: assetDocuments.updated_at,
        // Asset fields for priority calculation
        asset_type: assets.asset_type,
      })
      .from(assetDocuments)
      .innerJoin(assets, eq(assetDocuments.asset_id, assets.id))
      .where(whereClause)
      .orderBy(desc(assetDocuments.uploaded_at));

    // Map database results to TypeScript interfaces
    return documents.map((dbRow): DocumentMetadata => {
      const expiryDate = dbRow.expiry_date
        ? new Date(dbRow.expiry_date)
        : undefined;

      return {
        id: dbRow.id,
        assetId: dbRow.asset_id,
        userEmail: dbRow.user_email,
        fileName: dbRow.file_name,
        originalName: dbRow.original_name,
        fileType: dbRow.file_type,
        fileSize: dbRow.file_size,
        mimeType: dbRow.mime_type,
        blobUrl: dbRow.blob_url,
        blobPathname: dbRow.blob_pathname,
        blobDownloadUrl: dbRow.blob_download_url || undefined,
        category: dbRow.document_category as DocumentCategory,
        documentType: dbRow.document_type,
        priority: this.getDocumentPriority(
          dbRow.asset_type,
          dbRow.document_type,
        ),
        status: this.getDocumentStatus(expiryDate),
        description: dbRow.description || undefined,
        expiryDate: expiryDate,
        issueDate: dbRow.issue_date ? new Date(dbRow.issue_date) : undefined,
        uploadedAt: new Date(dbRow.uploaded_at!),
        createdAt: new Date(dbRow.created_at!),
        updatedAt: new Date(dbRow.updated_at!),
      };
    });
  }

  /**
   * Get a signed URL for document download
   */
  async getDocumentUrl(documentId: string, userEmail: string): Promise<string> {
    const documents = await db
      .select({
        blob_url: assetDocuments.blob_url,
        blob_pathname: assetDocuments.blob_pathname,
        user_email: assets.user_email,
      })
      .from(assetDocuments)
      .innerJoin(assets, eq(assetDocuments.asset_id, assets.id))
      .where(eq(assetDocuments.id, documentId))
      .limit(1);

    if (documents.length === 0) {
      throw new Error("Document not found");
    }

    if (documents[0].user_email !== userEmail) {
      throw new Error("Unauthorized to access this document");
    }

    // Log the access
    await this.logDocumentAction(documentId, userEmail, "view");

    // For now, return the blob URL directly
    // In production, you might want to generate a time-limited signed URL
    return documents[0].blob_url;
  }

  /**
   * Get document statistics for a user
   */
  async getUserDocumentStats(userEmail: string): Promise<DocumentStats> {
    // Get total stats
    const totalStats = await db
      .select({
        total: count(),
        totalSize: sum(assetDocuments.file_size),
        lastUpdated: max(assetDocuments.uploaded_at),
      })
      .from(assetDocuments)
      .where(eq(assetDocuments.user_email, userEmail));

    // Get category breakdown
    const categoryStats = await db
      .select({
        category: assetDocuments.document_category,
        count: count(),
      })
      .from(assetDocuments)
      .where(eq(assetDocuments.user_email, userEmail))
      .groupBy(assetDocuments.document_category);

    const stats: DocumentStats = {
      total: Number(totalStats[0]?.total || 0),
      byCategory: {} as Record<DocumentCategory, number>,
      byStatus: {} as any, // Status is computed, not stored
      totalSize: Number(totalStats[0]?.totalSize || 0),
      lastUpdated: totalStats[0]?.lastUpdated || new Date(),
    };

    // Populate category stats
    categoryStats.forEach((row) => {
      const category = row.category as DocumentCategory;

      stats.byCategory[category] = Number(row.count);
    });

    return stats;
  }

  /**
   * Copy documents from one asset to another (useful for duplicating assets)
   */
  async copyDocuments(
    sourceAssetId: string,
    targetAssetId: string,
    userEmail: string,
  ): Promise<void> {
    const documents = await this.getAssetDocuments(sourceAssetId, userEmail);

    for (const doc of documents) {
      // Get the blob data
      const response = await fetch(doc.blobUrl);
      const blob = await response.blob();
      const file = new File([blob], doc.originalName, { type: doc.mimeType });

      // Upload to new asset
      await this.uploadDocument(file, targetAssetId, userEmail, {
        assetId: targetAssetId,
        category: doc.category,
        documentType: doc.documentType,
        description: doc.description,
        expiryDate: doc.expiryDate?.toISOString(),
        issueDate: doc.issueDate?.toISOString(),
      });
    }
  }

  /**
   * Log document actions for audit trail
   */
  private async logDocumentAction(
    documentId: string,
    userEmail: string,
    action: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const newLogEntry: NewDocumentAuditLog = {
        document_id: documentId,
        user_email: userEmail,
        action: action,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      };

      await db.insert(documentAuditLog).values(newLogEntry);
    } catch (error) {
      // Log error but don't fail the main operation
      console.error("Failed to log document action:", error);
    }
  }

  /**
   * Check if a document type is already uploaded for an asset
   */
  async hasDocumentType(
    assetId: string,
    documentType: string,
  ): Promise<boolean> {
    const result = await db
      .select({ count: count() })
      .from(assetDocuments)
      .where(
        and(
          eq(assetDocuments.asset_id, assetId),
          eq(assetDocuments.document_type, documentType),
        ),
      );

    return result[0].count > 0;
  }

  /**
   * Get document completeness for an asset
   */
  async getDocumentCompleteness(
    assetId: string,
    assetType: string,
  ): Promise<{
    percentage: number;
    required: number;
    uploaded: number;
    missing: string[];
  }> {
    // Get required documents for this asset type
    const requiredDocs = await db
      .select({
        document_type: documentRequirements.document_type,
        display_name: documentRequirements.display_name,
      })
      .from(documentRequirements)
      .where(
        and(
          eq(documentRequirements.asset_type, assetType),
          eq(documentRequirements.is_required, true),
        ),
      );

    // Get uploaded documents for this asset
    const uploadedDocs = await db
      .selectDistinct({
        document_type: assetDocuments.document_type,
      })
      .from(assetDocuments)
      .where(eq(assetDocuments.asset_id, assetId));

    const uploadedTypes = uploadedDocs.map((d) => d.document_type);
    const missing = requiredDocs
      .filter((r) => !uploadedTypes.includes(r.document_type))
      .map((r) => r.display_name);

    const required = requiredDocs.length;
    const uploaded = uploadedTypes.filter((t) =>
      requiredDocs.some((r) => r.document_type === t),
    ).length;

    return {
      percentage: required > 0 ? (uploaded / required) * 100 : 100,
      required,
      uploaded,
      missing,
    };
  }
}

// Export singleton instance
export const documentStorage = new DocumentStorageService();
