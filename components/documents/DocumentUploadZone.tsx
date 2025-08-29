"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardBody,
  Progress,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Input,
  Textarea,
} from "@heroui/react";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

import {
  DocumentCategory,
  DocumentUploadProgress,
  getDocumentCategoryDisplay,
  formatFileSize,
  validateFileType,
  validateFileSize,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
} from "@/types/documents";

interface DocumentUploadZoneProps {
  assetId: string;
  assetType: string;
  onUploadComplete?: (documentId: string) => void;
  onError?: (error: string) => void;
  suggestedCategory?: DocumentCategory;
  suggestedType?: string;
  maxFiles?: number;
}

export default function DocumentUploadZone({
  assetId,
  assetType,
  onUploadComplete,
  onError,
  suggestedCategory,
  suggestedType,
  maxFiles = 5,
}: DocumentUploadZoneProps) {
  const [uploadQueue, setUploadQueue] = useState<DocumentUploadProgress[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentMetadata, setDocumentMetadata] = useState({
    category: suggestedCategory || DocumentCategory.OTHER,
    documentType: suggestedType || "",
    description: "",
    issueDate: "",
    expiryDate: "",
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Validate files
      const validFiles = acceptedFiles.filter((file) => {
        if (!validateFileType(file)) {
          onError?.(`File type not allowed: ${file.name}`);

          return false;
        }
        if (!validateFileSize(file)) {
          onError?.(
            `File too large: ${file.name} (max ${formatFileSize(MAX_FILE_SIZE)})`,
          );

          return false;
        }

        return true;
      });

      if (validFiles.length > 0) {
        // For single file, show metadata modal
        if (validFiles.length === 1) {
          setSelectedFile(validFiles[0]);
          setIsModalOpen(true);
        } else {
          // For multiple files, upload directly with default metadata
          validFiles.forEach((file) => uploadFile(file));
        }
      }
    },
    [onError],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES.reduce(
      (acc, type) => {
        acc[type] = [];

        return acc;
      },
      {} as Record<string, string[]>,
    ),
    maxFiles,
    maxSize: MAX_FILE_SIZE,
  });

  const uploadFile = async (file: File, metadata = documentMetadata) => {
    const uploadId = `${file.name}-${Date.now()}`;

    // Add to upload queue
    setUploadQueue((prev) => [
      ...prev,
      {
        fileName: file.name,
        progress: 0,
        status: "uploading",
      },
    ]);

    const formData = new FormData();

    formData.append("file", file);
    formData.append("category", metadata.category);
    formData.append("documentType", metadata.documentType);
    formData.append("description", metadata.description);
    if (metadata.issueDate) formData.append("issueDate", metadata.issueDate);
    if (metadata.expiryDate) formData.append("expiryDate", metadata.expiryDate);

    try {
      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.fileName === file.name ? { ...item, progress } : item,
            ),
          );
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.fileName === file.name
                ? { ...item, status: "complete", progress: 100 }
                : item,
            ),
          );
          onUploadComplete?.(response.id);
        } else {
          // Parse error response for better error messages
          let errorMessage = "Upload failed";

          try {
            const errorResponse = JSON.parse(xhr.responseText);

            errorMessage = errorResponse.error || errorMessage;
          } catch {
            errorMessage = `Upload failed: ${xhr.statusText}`;
          }

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.fileName === file.name
                ? { ...item, status: "error", error: errorMessage }
                : item,
            ),
          );
          onError?.(errorMessage);
        }
      });

      // Handle error
      xhr.addEventListener("error", () => {
        const errorMessage = "Network error occurred during upload";

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.fileName === file.name
              ? { ...item, status: "error", error: errorMessage }
              : item,
          ),
        );
        onError?.(`${errorMessage}: ${file.name}`);
      });

      // Send request
      xhr.open("POST", `/api/assets/${assetId}/documents`);
      xhr.send(formData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      console.error("Upload error:", error);

      setUploadQueue((prev) =>
        prev.map((item) =>
          item.fileName === file.name
            ? { ...item, status: "error", error: errorMessage }
            : item,
        ),
      );
      onError?.(`Error uploading ${file.name}: ${errorMessage}`);
    }
  };

  const handleModalUpload = () => {
    if (selectedFile) {
      // Validate required fields
      if (!documentMetadata.category) {
        onError?.("Please select a document category");

        return;
      }

      if (!documentMetadata.documentType.trim()) {
        onError?.("Please specify a document type");

        return;
      }

      // Validate dates if provided
      if (
        documentMetadata.issueDate &&
        isNaN(new Date(documentMetadata.issueDate).getTime())
      ) {
        onError?.("Invalid issue date format");

        return;
      }

      if (
        documentMetadata.expiryDate &&
        isNaN(new Date(documentMetadata.expiryDate).getTime())
      ) {
        onError?.("Invalid expiry date format");

        return;
      }

      uploadFile(selectedFile, documentMetadata);
      setIsModalOpen(false);
      setSelectedFile(null);
      // Reset metadata for next upload
      setDocumentMetadata({
        category: suggestedCategory || DocumentCategory.OTHER,
        documentType: suggestedType || "",
        description: "",
        issueDate: "",
        expiryDate: "",
      });
    }
  };

  const removeFromQueue = (fileName: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.fileName !== fileName));
  };

  return (
    <>
      <div className="space-y-4">
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200 
            ${
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-default-300 hover:border-primary/50"
            }
          `}
        >
          <input {...getInputProps()} />
          <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-4 text-default-400" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop files here...</p>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">
                Drag & drop documents here
              </p>
              <p className="text-sm text-default-500 mb-4">
                or click to browse files
              </p>
              <p className="text-xs text-default-400">
                Supported: PDF, JPG, PNG, Word, Excel (max{" "}
                {formatFileSize(MAX_FILE_SIZE)})
              </p>
            </>
          )}
        </div>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <Card>
            <CardBody className="space-y-3">
              <h4 className="font-medium">Upload Progress</h4>
              {uploadQueue.map((item) => (
                <div key={item.fileName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DocumentIcon className="w-5 h-5 text-default-500" />
                      <span className="text-sm">{item.fileName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === "complete" && (
                        <CheckCircleIcon className="w-5 h-5 text-success" />
                      )}
                      {item.status === "error" && (
                        <ExclamationCircleIcon className="w-5 h-5 text-danger" />
                      )}
                      {item.status === "complete" && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => removeFromQueue(item.fileName)}
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {item.status === "uploading" && (
                    <Progress
                      className="w-full"
                      color="primary"
                      size="sm"
                      value={item.progress}
                    />
                  )}
                  {item.error && (
                    <p className="text-xs text-danger">{item.error}</p>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>
        )}
      </div>

      {/* Metadata Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Document Details</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-default-600 mb-2">
                  File: {selectedFile?.name}
                </p>
                <p className="text-xs text-default-400">
                  Size: {selectedFile && formatFileSize(selectedFile.size)}
                </p>
              </div>

              <Select
                label="Document Category"
                selectedKeys={[documentMetadata.category]}
                onSelectionChange={(keys) =>
                  setDocumentMetadata({
                    ...documentMetadata,
                    category: Array.from(keys)[0] as DocumentCategory,
                  })
                }
              >
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

              <Input
                isRequired
                label="Document Type"
                placeholder="e.g., Bank Statement, Title Deed"
                value={documentMetadata.documentType}
                onValueChange={(value) =>
                  setDocumentMetadata({
                    ...documentMetadata,
                    documentType: value,
                  })
                }
              />

              <Textarea
                label="Description (Optional)"
                placeholder="Add any notes about this document"
                value={documentMetadata.description}
                onValueChange={(value) =>
                  setDocumentMetadata({
                    ...documentMetadata,
                    description: value,
                  })
                }
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Issue Date (Optional)"
                  type="date"
                  value={documentMetadata.issueDate}
                  onValueChange={(value) =>
                    setDocumentMetadata({
                      ...documentMetadata,
                      issueDate: value,
                    })
                  }
                />
                <Input
                  label="Expiry Date (Optional)"
                  type="date"
                  value={documentMetadata.expiryDate}
                  onValueChange={(value) =>
                    setDocumentMetadata({
                      ...documentMetadata,
                      expiryDate: value,
                    })
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              isDisabled={
                !documentMetadata.category ||
                !documentMetadata.documentType.trim()
              }
              onPress={handleModalUpload}
            >
              Upload Document
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
