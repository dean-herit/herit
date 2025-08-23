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
            <Button color="primary" onPress={() => window.location.reload()}>
              Retry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={className}
      data-component-category="data-display"
      data-component-id="document-manager"
    >
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
              data-component-category="ui"
              data-component-id="progress"
              size="sm"
              value={completeness.percentage}
            />
            {completeness.missing.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-warning-600">
                  <ExclamationTriangleIcon
                    className="w-4 h-4 inline mr-1"
                    data-component-category="ui"
                    data-component-id="exclamation-triangle-icon"
                  />
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
                startContent={
                  <PlusIcon
                    className="w-4 h-4"
                    data-component-category="ui"
                    data-component-id="plus-icon"
                  />
                }
                onPress={onUploadOpen}
              >
                Upload Documents
              </Button>
            </div>

            <div className="flex gap-2 flex-1">
              <Input
                className="max-w-sm"
                placeholder="Search documents..."
                startContent={
                  <MagnifyingGlassIcon
                    className="w-4 h-4"
                    data-component-category="ui"
                    data-component-id="magnifying-glass-icon"
                  />
                }
                value={searchTerm}
                onValueChange={setSearchTerm}
              />

              <Select
                className="max-w-xs"
                data-component-category="ui"
                data-component-id="select"
                placeholder="Filter by category"
                selectedKeys={[selectedCategory]}
                onSelectionChange={(keys) =>
                  setSelectedCategory(Array.from(keys)[0] as string)
                }
              >
                <SelectItem
                  key="all"
                  data-component-category="ui"
                  data-component-id="select-item"
                >
                  All Categories
                </SelectItem>
                <SelectItem
                  key={DocumentCategory.LEGAL}
                  data-component-category="ui"
                  data-component-id="select-item"
                >
                  {getDocumentCategoryDisplay(DocumentCategory.LEGAL)}
                </SelectItem>
                <SelectItem
                  key={DocumentCategory.FINANCIAL}
                  data-component-category="ui"
                  data-component-id="select-item"
                >
                  {getDocumentCategoryDisplay(DocumentCategory.FINANCIAL)}
                </SelectItem>
                <SelectItem
                  key={DocumentCategory.VALUATION}
                  data-component-category="ui"
                  data-component-id="select-item"
                >
                  {getDocumentCategoryDisplay(DocumentCategory.VALUATION)}
                </SelectItem>
                <SelectItem
                  key={DocumentCategory.OWNERSHIP}
                  data-component-category="ui"
                  data-component-id="select-item"
                >
                  {getDocumentCategoryDisplay(DocumentCategory.OWNERSHIP)}
                </SelectItem>
                <SelectItem
                  key={DocumentCategory.CERTIFICATE}
                  data-component-category="ui"
                  data-component-id="select-item"
                >
                  {getDocumentCategoryDisplay(DocumentCategory.CERTIFICATE)}
                </SelectItem>
                <SelectItem
                  key={DocumentCategory.STATEMENT}
                  data-component-category="ui"
                  data-component-id="select-item"
                >
                  {getDocumentCategoryDisplay(DocumentCategory.STATEMENT)}
                </SelectItem>
                <SelectItem
                  key={DocumentCategory.AGREEMENT}
                  data-component-category="ui"
                  data-component-id="select-item"
                >
                  {getDocumentCategoryDisplay(DocumentCategory.AGREEMENT)}
                </SelectItem>
                <SelectItem
                  key={DocumentCategory.REGISTRATION}
                  data-component-category="ui"
                  data-component-id="select-item"
                >
                  {getDocumentCategoryDisplay(DocumentCategory.REGISTRATION)}
                </SelectItem>
                <SelectItem
                  key={DocumentCategory.INSURANCE}
                  data-component-category="ui"
                  data-component-id="select-item"
                >
                  {getDocumentCategoryDisplay(DocumentCategory.INSURANCE)}
                </SelectItem>
                <SelectItem
                  key={DocumentCategory.TAX}
                  data-component-category="ui"
                  data-component-id="select-item"
                >
                  {getDocumentCategoryDisplay(DocumentCategory.TAX)}
                </SelectItem>
                <SelectItem
                  key={DocumentCategory.COMPLIANCE}
                  data-component-category="ui"
                  data-component-id="select-item"
                >
                  {getDocumentCategoryDisplay(DocumentCategory.COMPLIANCE)}
                </SelectItem>
                <SelectItem
                  key={DocumentCategory.OTHER}
                  data-component-category="ui"
                  data-component-id="select-item"
                >
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
            <DocumentIcon
              className="w-12 h-12 mx-auto mb-4 text-default-400"
              data-component-category="ui"
              data-component-id="document-icon"
            />
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
                        <Chip
                          data-component-category="ui"
                          data-component-id="chip"
                          size="sm"
                          variant="flat"
                        >
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
                    <Tooltip
                      content="Preview"
                      data-component-category="ui"
                      data-component-id="tooltip"
                    >
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handlePreviewDocument(doc)}
                      >
                        <EyeIcon
                          className="w-4 h-4"
                          data-component-category="ui"
                          data-component-id="eye-icon"
                        />
                      </Button>
                    </Tooltip>

                    <Tooltip
                      content="Download"
                      data-component-category="ui"
                      data-component-id="tooltip"
                    >
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleDownloadDocument(doc)}
                      >
                        <CloudArrowDownIcon
                          className="w-4 h-4"
                          data-component-category="ui"
                          data-component-id="cloud-arrow-down-icon"
                        />
                      </Button>
                    </Tooltip>

                    <Tooltip
                      content="Delete"
                      data-component-category="ui"
                      data-component-id="tooltip"
                    >
                      <Button
                        isIconOnly
                        color="danger"
                        size="sm"
                        variant="light"
                        onPress={() => handleDeleteDocument(doc.id)}
                      >
                        <TrashIcon
                          className="w-4 h-4"
                          data-component-category="ui"
                          data-component-id="trash-icon"
                        />
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
      <Modal
        data-component-category="ui"
        data-component-id="modal"
        isOpen={isUploadOpen}
        size="lg"
        onClose={onUploadClose}
      >
        <ModalContent
          data-component-category="ui"
          data-component-id="modal-content"
        >
          <ModalHeader
            data-component-category="ui"
            data-component-id="modal-header"
          >
            Upload Documents
          </ModalHeader>
          <ModalBody
            data-component-category="ui"
            data-component-id="modal-body"
          >
            <DocumentUploadZone
              assetId={assetId}
              assetType={assetType}
              data-component-category="ui"
              data-component-id="document-upload-zone"
              maxFiles={5}
              onError={(error) => {
                console.error("Upload error:", error);
                alert(`Upload error: ${error}`);
              }}
              onUploadComplete={handleDocumentUpload}
            />
          </ModalBody>
          <ModalFooter
            data-component-category="ui"
            data-component-id="modal-footer"
          >
            <Button variant="light" onPress={onUploadClose}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Preview Modal */}
      <Modal
        data-component-category="ui"
        data-component-id="modal"
        isOpen={isPreviewOpen}
        size="3xl"
        onClose={onPreviewClose}
      >
        <ModalContent
          data-component-category="ui"
          data-component-id="modal-content"
        >
          <ModalHeader
            data-component-category="ui"
            data-component-id="modal-header"
          >
            {previewDocument?.originalName}
          </ModalHeader>
          <ModalBody
            data-component-category="ui"
            data-component-id="modal-body"
          >
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
                    <DocumentIcon
                      className="w-12 h-12 mx-auto mb-4 text-default-400"
                      data-component-category="ui"
                      data-component-id="document-icon"
                    />
                    <p className="text-default-600">
                      Preview not available for this file type
                    </p>
                    <Button
                      className="mt-4"
                      onPress={() => handleDownloadDocument(previewDocument)}
                    >
                      Download to View
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter
            data-component-category="ui"
            data-component-id="modal-footer"
          >
            <Button variant="light" onPress={onPreviewClose}>
              Close
            </Button>
            {previewDocument && (
              <Button
                color="primary"
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
