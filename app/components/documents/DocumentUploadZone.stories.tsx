import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent, expect, fn } from "@storybook/test";
import { http, HttpResponse } from "msw";
import { DocumentUploadZone } from "./DocumentUploadZone";

const mockFile = new File(["test content"], "test-document.pdf", {
  type: "application/pdf",
});

const meta: Meta<typeof DocumentUploadZone> = {
  title: "Documents/DocumentUploadZone",
  component: DocumentUploadZone,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Drag-and-drop file upload zone with validation",
      },
    },
    msw: {
      handlers: [
        http.post("/api/documents/upload", () => {
          return HttpResponse.json({
            id: "doc-123",
            filename: "test-document.pdf",
            size: 1024,
            url: "/documents/test-document.pdf",
          });
        }),
        http.post("/api/blob/upload", () => {
          return HttpResponse.json({
            url: "https://blob.vercel-storage.com/test-document.pdf",
          });
        }),
      ],
    },
  },
  args: {
    onUpload: fn(),
    onError: fn(),
    maxFileSize: 10 * 1024 * 1024, // 10MB
    acceptedFileTypes: [".pdf", ".doc", ".docx", ".jpg", ".png"],
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify upload zone renders
    expect(canvas.getByText(/drag.*drop.*files/i)).toBeVisible();
    expect(canvas.getByText(/browse files/i)).toBeVisible();
    expect(canvas.getByText(/supported formats/i)).toBeVisible();

    // Verify file input exists
    expect(canvas.getByLabelText(/file upload/i)).toBeInTheDocument();
  },
};

// Interactive story
export const Interactive: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Test file selection via click
    const fileInput = canvas.getByLabelText(/file upload/i);
    const browseButton = canvas.getByText(/browse files/i);

    // Click browse button to trigger file input
    await userEvent.click(browseButton);

    // Simulate file selection
    await userEvent.upload(fileInput, mockFile);

    // Verify upload callback was called
    expect(args.onUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "test-document.pdf",
        type: "application/pdf",
      }),
    );
  },
};

// File too large error
export const FileTooLarge: Story = {
  args: {
    maxFileSize: 1024, // 1KB limit
  },
  parameters: {
    msw: {
      handlers: [
        http.post("/api/documents/upload", () => {
          return HttpResponse.json(
            { error: "File too large" },
            { status: 413 },
          );
        }),
      ],
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const largeFile = new File(["x".repeat(2048)], "large-file.pdf", {
      type: "application/pdf",
    });
    const fileInput = canvas.getByLabelText(/file upload/i);

    await userEvent.upload(fileInput, largeFile);

    expect(args.onError).toHaveBeenCalledWith(
      expect.stringContaining("too large"),
    );
  },
};

// Invalid file type
export const InvalidFileType: Story = {
  args: {
    acceptedFileTypes: [".pdf"],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const invalidFile = new File(["content"], "test.txt", {
      type: "text/plain",
    });
    const fileInput = canvas.getByLabelText(/file upload/i);

    await userEvent.upload(fileInput, invalidFile);

    expect(args.onError).toHaveBeenCalledWith(
      expect.stringContaining("file type"),
    );
  },
};

// Upload in progress
export const Uploading: Story = {
  args: {
    isUploading: true,
    uploadProgress: 45,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByText(/uploading/i)).toBeVisible();
    expect(canvas.getByText("45%")).toBeVisible();
    expect(canvas.getByRole("progressbar")).toBeVisible();
  },
};
