"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  DocumentMetadata,
  DocumentFilter,
  DocumentUpload,
} from "@/types/documents";

interface DocumentsResponse {
  documents: DocumentMetadata[];
  completeness: any; // Add proper type based on your API response
}

interface DocumentPreviewResponse {
  url: string;
  metadata: DocumentMetadata;
}

export function useDocuments(
  assetId: string,
  assetType: string,
  filter: DocumentFilter = {},
) {
  return useQuery<DocumentsResponse>({
    queryKey: ["documents", assetId, filter],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        assetType,
        ...(filter.category && { category: filter.category }),
        ...(filter.searchTerm && { search: filter.searchTerm }),
      });

      const response = await fetch(
        `/api/assets/${assetId}/documents?${searchParams}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load documents");
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - documents change less frequently
    refetchOnWindowFocus: false,
  });
}

export function useDocumentPreview() {
  return useMutation<DocumentPreviewResponse, Error, string>({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch document preview");
      }

      return response.json();
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      return response.json();
    },
    onSuccess: (_, documentId) => {
      // Invalidate documents queries for all assets
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assetId,
      file,
      metadata,
    }: {
      assetId: string;
      file: File;
      metadata: DocumentUpload;
    }) => {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("metadata", JSON.stringify(metadata));

      const response = await fetch(`/api/assets/${assetId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Failed to upload document");
      }

      return response.json();
    },
    onSuccess: (_, { assetId }) => {
      // Invalidate documents for the specific asset
      queryClient.invalidateQueries({ queryKey: ["documents", assetId] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      updateData,
    }: {
      documentId: string;
      updateData: Partial<DocumentUpload>;
    }) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Failed to update document");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all document queries
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDocumentDownload() {
  return useMutation<Blob, Error, string>({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}/download`);

      if (!response.ok) {
        throw new Error("Failed to download document");
      }

      return response.blob();
    },
  });
}
