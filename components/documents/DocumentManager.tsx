"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
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
  Divider,
  Tabs,
  Tab,
  Progress,
  Tooltip,
} from "@heroui/react";
import {
  DocumentIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import DocumentUploadZone from "./DocumentUploadZone";
import {
  DocumentMetadata,
  DocumentCategory,
  DocumentFilter,
  getDocumentCategoryDisplay,
  formatFileSize,
  getFileTypeIcon,
  getDocumentStatusColor,
  getDocumentPriorityColor,
} from "@/types/documents";

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
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [completeness, setCompleteness] = useState<any>(null);
  const [filter, setFilter] = useState<DocumentFilter>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const [previewDocument, setPreviewDocument] = useState<DocumentMetadata | null>(null);

  // Load documents
  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const searchParams = new URLSearchParams({
        assetType,
        ...(filter.category && { category: filter.category }),
        ...(filter.searchTerm && { search: filter.searchTerm }),
      });

      const response = await fetch(`/api/assets/${assetId}/documents?${searchParams}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
        setCompleteness(data.completeness);
      } else {
        console.error("Failed to load documents");
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter documents
  useEffect(() => {
    let filtered = documents;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  }, [documents, selectedCategory, searchTerm]);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [assetId, assetType]);

  const handleDocumentUpload = (documentId: string) => {
    console.log("Document uploaded:", documentId);
    loadDocuments(); // Reload documents
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          loadDocuments(); // Reload documents
        } else {
          alert("Failed to delete document");
        }
      } catch (error) {
        console.error("Error deleting document:", error);
        alert("Error deleting document");
      }
    }
  };

  const handlePreviewDocument = async (doc: DocumentMetadata) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}`);
      if (response.ok) {
        const data = await response.json();
        setPreviewDocument({ ...doc, blobUrl: data.url });
        onPreviewOpen();
      } else {
        alert("Failed to load document");
      }
    } catch (error) {
      console.error("Error loading document:", error);
      alert("Error loading document");
    }
  };

  const handleDownloadDocument = async (doc: DocumentMetadata) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}`);
      if (response.ok) {
        const data = await response.json();
        const link = document.createElement("a");
        link.href = data.url;
        link.download = doc.originalName;
        link.click();
      } else {
        alert("Failed to download document");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Error downloading document");
    }
  };

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
              size="sm"
              value={completeness.percentage}
              color={completeness.percentage >= 100 ? "success" : "warning"}
              className="w-full"
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
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={onUploadOpen}
              >
                Upload Documents
              </Button>
            </div>

            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Search documents..."
                startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="max-w-sm"
              />
              
              <Select
                placeholder="Filter by category"
                selectedKeys={[selectedCategory]}
                onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
                className="max-w-xs"
              >
                <SelectItem key="all">
                  All Categories
                </SelectItem>
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
                        size="sm"
                        variant="light"
                        color="danger"
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
      <Modal isOpen={isUploadOpen} onClose={onUploadClose} size="lg">
        <ModalContent>
          <ModalHeader>Upload Documents</ModalHeader>
          <ModalBody>
            <DocumentUploadZone
              assetId={assetId}
              assetType={assetType}
              onUploadComplete={handleDocumentUpload}
              onError={(error) => {
                console.error("Upload error:", error);
                alert(`Upload error: ${error}`);
              }}
              maxFiles={5}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onUploadClose}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="3xl">
        <ModalContent>
          <ModalHeader>
            {previewDocument?.originalName}
          </ModalHeader>
          <ModalBody>
            {previewDocument && (
              <div className="min-h-96">
                {previewDocument.mimeType.startsWith("image/") ? (
                  <img
                    src={previewDocument.blobUrl}
                    alt={previewDocument.originalName}
                    className="max-w-full h-auto"
                  />
                ) : previewDocument.mimeType === "application/pdf" ? (
                  <iframe
                    src={previewDocument.blobUrl}
                    className="w-full h-96"
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