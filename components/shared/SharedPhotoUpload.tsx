"use client";

import { useState, useRef, useCallback } from "react";
import { Avatar, Button, Progress, Input } from "@heroui/react";
import {
  PhotoIcon,
  CloudArrowUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

export type PhotoUploadMode = "onboarding" | "beneficiary";

interface SharedPhotoUploadProps {
  mode: PhotoUploadMode;
  value?: string;
  onChange: (value: string) => void;
  name?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  className?: string;
}

export function SharedPhotoUpload({
  mode,
  value = "",
  onChange,
  name = "",
  isInvalid = false,
  errorMessage,
  className = "",
}: SharedPhotoUploadProps) {
  const [url, setUrl] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();

      setUrl(result.url);
      onChange(result.url);
      toast.success("Photo uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      // Fallback to URL input if upload fails
      setShowUrlInput(true);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload photo. You can enter a photo URL instead.",
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

  const clearPhoto = () => {
    setUrl("");
    onChange("");
    setShowUrlInput(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlChange = (urlValue: string) => {
    setUrl(urlValue);
    onChange(urlValue);
  };

  const getTitle = () => {
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
    if (url) {
      return "Click the X to remove or upload a new photo";
    }

    return mode === "onboarding"
      ? "Upload your profile photo (optional)"
      : "Upload an image file";
  };

  return (
    <div
      className={`space-y-4 ${className}`}
      data-component-category="input"
      data-component-id={`${mode}-photo-upload`}
    >
      {/* Photo Preview */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar
            showFallback
            className="w-20 h-20"
            data-component-category="ui"
            data-component-id="photo-avatar"
            name={name}
            src={url || undefined}
          />
          {url && (
            <Button
              isIconOnly
              className="absolute -top-2 -right-2 min-w-6 w-6 h-6"
              color="danger"
              data-component-category="ui"
              data-component-id="photo-clear-button"
              size="sm"
              variant="solid"
              onPress={clearPhoto}
            >
              <XMarkIcon
                className="w-3 h-3"
                data-component-category="ui"
                data-component-id="x-mark-icon"
              />
            </Button>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{getTitle()}</h4>
          <p className="text-sm text-default-500">{getDescription()}</p>
        </div>
      </div>

      {/* URL Input Option */}
      {showUrlInput || mode === "onboarding" ? (
        <div className="space-y-2">
          <Input
            data-component-category="input"
            data-component-id="photo-url-input"
            errorMessage={errorMessage}
            isInvalid={isInvalid}
            label="Photo URL"
            placeholder="https://example.com/photo.jpg"
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
          />
          {mode === "beneficiary" && (
            <Button
              data-component-category="ui"
              data-component-id="hide-url-input-button"
              size="sm"
              variant="light"
              onPress={() => setShowUrlInput(false)}
            >
              Hide URL Input
            </Button>
          )}
        </div>
      ) : null}

      {/* Upload Area - Only show for beneficiaries or when URL input is hidden */}
      {mode === "beneficiary" && !showUrlInput && (
        <>
          {isUploading ? (
            <div className="space-y-2">
              <div className="text-sm text-default-600">Uploading...</div>
              <Progress
                showValueLabel
                color="primary"
                data-component-category="ui"
                data-component-id="upload-progress"
                size="sm"
                value={uploadProgress}
              />
            </div>
          ) : (
            <div
              aria-label="Click or drag to upload photo"
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-default-300 hover:border-default-400"
                }
              `}
              data-component-category="input"
              data-component-id="photo-upload-zone"
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
                type="file"
                onChange={handleFileInputChange}
              />
              <div className="space-y-2">
                {isDragging ? (
                  <CloudArrowUpIcon
                    className="w-10 h-10 mx-auto text-primary"
                    data-component-category="ui"
                    data-component-id="cloud-arrow-up-icon"
                  />
                ) : (
                  <PhotoIcon
                    className="w-10 h-10 mx-auto text-default-400"
                    data-component-category="ui"
                    data-component-id="photo-icon"
                  />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {isDragging
                      ? "Drop your image here"
                      : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-default-500">
                    PNG, JPG, WebP or GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="text-center">
            <Button
              data-component-category="ui"
              data-component-id="show-url-input-button"
              size="sm"
              variant="light"
              onPress={() => setShowUrlInput(true)}
            >
              Or enter photo URL
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
