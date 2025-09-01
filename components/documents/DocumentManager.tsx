"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Select,
  SelectItem,
  Progress,
  Tooltip,
} from "@heroui/react";
import {
  DocumentIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import DocumentUploadZone from "./DocumentUploadZone";

import {
  DocumentMetadata,
  DocumentCategory,
  getDocumentCategoryDisplay,
  formatFileSize,
  getFileTypeIcon,
} from "@/types/documents";
import {
  useDocuments,
  useDeleteDocument,
  useDocumentPreview,
  useDocumentDownload,
} from "@/hooks/useDocuments";

interface DocumentManagerProps {
  assetId: string;
  assetType: string;
  className?: string;
}

export default function DocumentManager({
  assetId,
  assetType,
  className = "",
}: DocumentManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Create filter object for the hook
  const filter = useMemo(
    () => ({
      category:
        selectedCategory !== "all"
          ? (selectedCategory as DocumentCategory)
          : undefined,
      searchTerm: searchTerm || undefined,
    }),
    [selectedCategory, searchTerm],
  );

  // Use TanStack Query hooks
  const {
    data: documentsResponse,
    isLoading,
    error,
  } = useDocuments(assetId, assetType, filter);

  const deleteDocumentMutation = useDeleteDocument();
  const previewDocumentMutation = useDocumentPreview();
  const downloadDocumentMutation = useDocumentDownload();

  const documents = documentsResponse?.documents || [];
  const completeness = documentsResponse?.completeness;

  // Filter documents locally for immediate feedback
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    return filtered;
  }, [documents, selectedCategory, searchTerm]);

  const {
    isOpen: isUploadOpen,
    onOpen: onUploadOpen,
    onClose: onUploadClose,
  } = useDisclosure();
  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose,
  } = useDisclosure();
  const [previewDocument, setPreviewDocument] =
    useState<DocumentMetadata | null>(null);

  const handleDocumentUpload = (documentId: string) => {
    console.log("Document uploaded:", documentId);
    // Documents will auto-refresh via query invalidation
  };

  const handleDeleteDocument = (documentId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocumentMutation.mutate(documentId, {
        onError: (error) => {
          console.error("Error deleting document:", error);
          alert("Failed to delete document. Please try again.");
        },
      });
    }
  };

  const handlePreviewDocument = (doc: DocumentMetadata) => {
    previewDocumentMutation.mutate(doc.id, {
      onSuccess: (data) => {
        setPreviewDocument({ ...doc, blobUrl: data.url });
        onPreviewOpen();
      },
      onError: (error) => {
        console.error("Error previewing document:", error);
        alert("Failed to load document preview. Please try again.");
      },
    });
  };

  const handleDownloadDocument = (doc: DocumentMetadata) => {
    downloadDocumentMutation.mutate(doc.id, {
      onSuccess: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = doc.originalName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      onError: (error) => {
        console.error("Error downloading document:", error);
        alert("Failed to download document. Please try again.");
      },
    });
  };

  // Error state
  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardBody className="p-6 text-center">
            <p className="text-red-600 mb-4">
              Failed to load documents. Please try again.
            </p>
            <Button
              color="primary"
              data-testid="Button-idw9fcvtd"
              onPress={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with completeness indicator */}
      {completeness && (
        <Card className="mb-4">
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Document Completeness</h4>
              <span className="text-sm text-default-600">
                {completeness.uploaded} of {completeness.required} required
              </span>
            </div>
            <Progress
              className="w-full"
              color={completeness.percentage >= 100 ? "success" : "warning"}
              size="sm"
              value={completeness.percentage}
            />
            {completeness.missing.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-warning-600">
                  <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                  Missing: {completeness.missing.join(", ")}
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Controls */}
      <Card className="mb-4">
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex gap-2">
              <Button
                color="primary"
                data-testid="Button-voll4rlhc"
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={onUploadOpen}
              >
                Upload Documents
              </Button>
            </div>

            <div className="flex gap-2 flex-1">
              <Input
                className="max-w-sm"
                placeholder="Search documents..."
                startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />

              <Select
                className="max-w-xs"
                placeholder="Filter by category"
                selectedKeys={[selectedCategory]}
                onSelectionChange={(keys) =>
                  setSelectedCategory(Array.from(keys)[0] as string)
                }
              >
                <SelectItem key="all">All Categories</SelectItem>
                <SelectItem key={DocumentCategory.LEGAL}>
                  {getDocumentCategoryDisplay(DocumentCategory.LEGAL)}
                </SelectItem>
                <SelectItem key={DocumentCategory.FINANCIAL}>
                  {getDocumentCategoryDisplay(DocumentCategory.FINANCIAL)}
                </SelectItem>
                <SelectItem key={DocumentCategory.VALUATION}>
                  {getDocumentCategoryDisplay(DocumentCategory.VALUATION)}
                </SelectItem>
                <SelectItem key={DocumentCategory.OWNERSHIP}>
                  {getDocumentCategoryDisplay(DocumentCategory.OWNERSHIP)}
                </SelectItem>
                <SelectItem key={DocumentCategory.CERTIFICATE}>
                  {getDocumentCategoryDisplay(DocumentCategory.CERTIFICATE)}
                </SelectItem>
                <SelectItem key={DocumentCategory.STATEMENT}>
                  {getDocumentCategoryDisplay(DocumentCategory.STATEMENT)}
                </SelectItem>
                <SelectItem key={DocumentCategory.AGREEMENT}>
                  {getDocumentCategoryDisplay(DocumentCategory.AGREEMENT)}
                </SelectItem>
                <SelectItem key={DocumentCategory.REGISTRATION}>
                  {getDocumentCategoryDisplay(DocumentCategory.REGISTRATION)}
                </SelectItem>
                <SelectItem key={DocumentCategory.INSURANCE}>
                  {getDocumentCategoryDisplay(DocumentCategory.INSURANCE)}
                </SelectItem>
                <SelectItem key={DocumentCategory.TAX}>
                  {getDocumentCategoryDisplay(DocumentCategory.TAX)}
                </SelectItem>
                <SelectItem key={DocumentCategory.COMPLIANCE}>
                  {getDocumentCategoryDisplay(DocumentCategory.COMPLIANCE)}
                </SelectItem>
                <SelectItem key={DocumentCategory.OTHER}>
                  {getDocumentCategoryDisplay(DocumentCategory.OTHER)}
                </SelectItem>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Documents Grid/List */}
      {isLoading ? (
        <Card>
          <CardBody className="p-8 text-center">
            <div className="animate-pulse">
              <p className="text-default-600">Loading documents...</p>
            </div>
          </CardBody>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardBody className="p-8 text-center">
            <DocumentIcon className="w-12 h-12 mx-auto mb-4 text-default-400" />
            <p className="text-default-600 mb-2">No documents found</p>
            <p className="text-sm text-default-400">
              {searchTerm || selectedCategory !== "all"
                ? "Try adjusting your search or filter"
                : "Upload documents to get started"}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getFileTypeIcon(doc.mimeType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium truncate">
                        {doc.originalName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Chip size="sm" variant="flat">
                          {getDocumentCategoryDisplay(doc.category)}
                        </Chip>
                        <span className="text-xs text-default-500">
                          {formatFileSize(doc.fileSize)}
                        </span>
                        <span className="text-xs text-default-500">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-default-600 mt-1 truncate">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tooltip content="Preview">
                      <Button
                        isIconOnly
                        data-testid="Button-n9ef09c1a"
                        size="sm"
                        variant="light"
                        onPress={() => handlePreviewDocument(doc)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>

                    <Tooltip content="Download">
                      <Button
                        isIconOnly
                        data-testid="Button-8fgohb66x"
                        size="sm"
                        variant="light"
                        onPress={() => handleDownloadDocument(doc)}
                      >
                        <CloudArrowDownIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>

                    <Tooltip content="Delete">
                      <Button
                        isIconOnly
                        color="danger"
                        data-testid="Button-k9em060ae"
                        size="sm"
                        variant="light"
                        onPress={() => handleDeleteDocument(doc.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={isUploadOpen} size="lg" onClose={onUploadClose}>
        <ModalContent>
          <ModalHeader>Upload Documents</ModalHeader>
          <ModalBody>
            <DocumentUploadZone
              assetId={assetId}
              assetType={assetType}
              maxFiles={5}
              onError={(error) => {
                console.error("Upload error:", error);
                alert(`Upload error: ${error}`);
              }}
              onUploadComplete={handleDocumentUpload}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              data-testid="Button-1sqw68hb6"
              variant="light"
              onPress={onUploadClose}
            >
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} size="3xl" onClose={onPreviewClose}>
        <ModalContent>
          <ModalHeader>{previewDocument?.originalName}</ModalHeader>
          <ModalBody>
            {previewDocument && (
              <div className="min-h-96">
                {previewDocument.mimeType.startsWith("image/") ? (
                  <img
                    alt={previewDocument.originalName}
                    className="max-w-full h-auto"
                    src={previewDocument.blobUrl}
                  />
                ) : previewDocument.mimeType === "application/pdf" ? (
                  <iframe
                    className="w-full h-96"
                    src={previewDocument.blobUrl}
                    title={previewDocument.originalName}
                  />
                ) : (
                  <div className="text-center p-8">
                    <DocumentIcon className="w-12 h-12 mx-auto mb-4 text-default-400" />
                    <p className="text-default-600">
                      Preview not available for this file type
                    </p>
                    <Button
                      className="mt-4"
                      data-testid="Button-8zuc3ica2"
                      onPress={() => handleDownloadDocument(previewDocument)}
                    >
                      Download to View
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              data-testid="Button-kxi85hwss"
              variant="light"
              onPress={onPreviewClose}
            >
              Close
            </Button>
            {previewDocument && (
              <Button
                color="primary"
                data-testid="Button-ynmury083"
                onPress={() => handleDownloadDocument(previewDocument)}
              >
                Download
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
