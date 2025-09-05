"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button, Progress } from "@heroui/react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

export type PhotoUploadMode = "onboarding" | "beneficiary";

interface SharedPhotoUploadProps {
  mode: PhotoUploadMode;
  value?: string;
  onChange: (value: string) => void;
  onMarkForDeletion?: (isMarked: boolean) => void;
  name?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  className?: string;
  hasExistingPhoto?: boolean; // Whether user had a photo when form loaded
}

export function SharedPhotoUpload({
  mode,
  value = "",
  onChange,
  onMarkForDeletion,
  name = "",
  isInvalid = false,
  errorMessage,
  className = "",
  hasExistingPhoto = false,
}: SharedPhotoUploadProps) {
  const [url, setUrl] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isMarkedForDeletion, setIsMarkedForDeletion] = useState(false);
  const [originalPhoto, setOriginalPhoto] = useState(value); // Store original photo for undo
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update original photo when value changes from parent (e.g., form initialization)
  useEffect(() => {
    if (value && value !== originalPhoto && !isMarkedForDeletion) {
      setOriginalPhoto(value);
    }
  }, [value, originalPhoto, isMarkedForDeletion]);

  // Different API endpoints based on mode
  const uploadEndpoint =
    mode === "beneficiary"
      ? "/api/beneficiaries/photo"
      : "/api/onboarding/photo";

  const validateFile = (file: File): boolean => {
    // Check file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Invalid file type. Only images (JPG, PNG, WebP, GIF) are allowed.",
      );

      return false;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 5MB.");

      return false;
    }

    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      formData.append("file", file);

      // Simulate progressive upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev; // Cap at 90% until real completion

          return prev + Math.random() * 20 + 5; // Random increment between 5-25%
        });
      }, 200);

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100); // Complete on response

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();

      setUrl(result.url);
      setOriginalPhoto(result.url);
      setUploadedFileSize(file.size);
      setIsMarkedForDeletion(false); // Clear any deletion marking when new photo uploaded
      onChange(result.url);
      onMarkForDeletion?.(false);
      toast.success("Photo uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload photo. Please try again.",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const markPhotoForDeletion = () => {
    if (!hasExistingPhoto || !originalPhoto) return;

    setIsMarkedForDeletion(true);
    setUrl(""); // Clear display but keep original for restoration
    onChange(""); // Update form value to empty
    onMarkForDeletion?.(true);
    toast.info(
      "Photo marked for deletion. It will be removed when you save the form.",
    );
  };

  const restorePhoto = () => {
    if (!originalPhoto) return;

    setIsMarkedForDeletion(false);
    setUrl(originalPhoto);
    onChange(originalPhoto);
    onMarkForDeletion?.(false);
    toast.success("Photo restored!");
  };

  const clearPhoto = () => {
    // Always clear the photo immediately to allow for replacement
    setUrl("");
    onChange("");
    setIsMarkedForDeletion(false);
    setUploadedFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // For existing photos, mark for deletion in the background
    if (hasExistingPhoto && onMarkForDeletion) {
      onMarkForDeletion(true);
    }
  };

  const getTitle = () => {
    if (isMarkedForDeletion) {
      switch (mode) {
        case "onboarding":
          return "Profile Photo - Marked for Deletion";
        case "beneficiary":
          return "Photo - Marked for Deletion";
        default:
          return "Photo - Marked for Deletion";
      }
    }

    switch (mode) {
      case "onboarding":
        return url ? "Profile Photo Added" : "Add Profile Photo";
      case "beneficiary":
        return url ? "Photo Added" : "Add Beneficiary Photo";
      default:
        return url ? "Photo Added" : "Add Photo";
    }
  };

  const getDescription = () => {
    if (isMarkedForDeletion) {
      return "Photo will be deleted when you save. Click restore to undo.";
    }

    if (url) {
      return hasExistingPhoto
        ? "Click the X to mark for deletion or upload a new photo"
        : "Click the X to remove or upload a new photo";
    }

    return mode === "onboarding"
      ? "Upload your profile photo (optional)"
      : "Upload an image file";
  };

  // Render different states based on photo availability

  if (url) {
    // State 2: Has photo - show photo with metadata and delete button
    // Extract photo metadata from URL or file
    const getPhotoMetadata = () => {
      try {
        const urlObj = new URL(url);
        const filename = urlObj.pathname.split("/").pop() || "photo.jpg";
        const extension = filename.split(".").pop()?.toUpperCase() || "JPG";

        // Extract timestamp and clean filename (format: timestamp-originalname)
        const timestampMatch = filename.match(/^(\d{13})-(.*)/);
        let cleanFilename = filename;
        let uploadDateTime = "Recently uploaded";

        if (timestampMatch) {
          const timestamp = parseInt(timestampMatch[1]);
          const date = new Date(timestamp);

          cleanFilename = timestampMatch[2]; // Get original filename without timestamp
          uploadDateTime = `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
        }

        // Format file size if available from upload
        let fileSize = "";

        if (uploadedFileSize) {
          const sizeInMB = uploadedFileSize / (1024 * 1024);

          if (sizeInMB < 1) {
            const sizeInKB = Math.round(uploadedFileSize / 1024);

            fileSize = `${sizeInKB} KB`;
          } else {
            fileSize = `${sizeInMB.toFixed(2)} MB`;
          }
        }

        return {
          title: cleanFilename,
          type: `${extension} Image`,
          fileSize,
          uploadDateTime,
          format: extension,
        };
      } catch {
        return {
          title: "Profile Photo",
          type: "Image File",
          fileSize: "",
          uploadDateTime: "Recently uploaded",
          format: "Unknown",
        };
      }
    };

    const metadata = getPhotoMetadata();

    return (
      <div
        className={`${className} relative w-full`}
        data-testid={`${mode}-photo-upload`}
      >
        <div className="flex items-center gap-8 w-full">
          <div className="w-32 h-32 bg-white rounded-lg shadow-sm overflow-hidden flex-shrink-0">
            <img
              alt="Uploaded profile"
              className="w-full h-full object-cover"
              src={url}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground mb-2 truncate">
              {metadata.title}
            </h3>
            <div className="space-y-1">
              {metadata.fileSize && (
                <p className="text-xs text-default-500">
                  <span className="font-medium">Size:</span> {metadata.fileSize}
                </p>
              )}
              <p className="text-xs text-default-500">
                <span className="font-medium">Uploaded:</span>{" "}
                {metadata.uploadDateTime}
              </p>
              <p className="text-xs text-default-500">
                <span className="font-medium">Format:</span> {metadata.format}
              </p>
            </div>
          </div>
        </div>
        {/* Remove button positioned in bottom right */}
        <div className="absolute bottom-2 right-2">
          <Button
            color="danger"
            data-testid="photo-delete-button"
            size="sm"
            variant="solid"
            onPress={clearPhoto}
          >
            Remove
          </Button>
        </div>
      </div>
    );
  }

  // State 1: No photo - show drag & drop interface matching your mockup
  return (
    <div className={`${className}`} data-testid={`${mode}-photo-upload`}>
      {isUploading ? (
        <div className="space-y-2 p-6">
          <div className="text-sm text-default-600">Uploading...</div>
          <Progress
            showValueLabel
            color="primary"
            data-component-category="ui"
            data-testid="button"
            size="sm"
            value={uploadProgress}
          />
        </div>
      ) : (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-default-300 hover:border-default-400"
            }
          `}
          data-testid="button"
          role="button"
          tabIndex={0}
          onClick={triggerFileSelect}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              triggerFileSelect();
            }
          }}
        >
          <input
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            data-testid="button"
            type="file"
            onChange={handleFileInputChange}
          />
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto text-default-400">
              <PhotoIcon className="w-full h-full" />
            </div>
            <div>
              <p className="text-lg font-medium text-default-700 mb-2">
                {isDragging ? "Drop your image here" : "Drop files here or"}
              </p>
              {!isDragging && (
                <Button
                  className="font-medium"
                  data-testid="button"
                  size="md"
                  variant="bordered"
                  onPress={triggerFileSelect}
                >
                  Browse files
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
