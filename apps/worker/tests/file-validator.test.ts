import { describe, it, expect, vi } from "vitest";
import { validateFileType } from "../src/services/file-validator";
import * as fileType from "file-type";

vi.mock("file-type", () => ({
  fileTypeFromFile: vi.fn(),
}));

describe("file-validator", () => {
  it("should identify images", async () => {
    vi.mocked(fileType.fileTypeFromFile).mockResolvedValueOnce({
      mime: "image/jpeg",
      ext: "jpg",
    });

    const result = await validateFileType("dummy.jpg");
    expect(result.isImage).toBe(true);
    expect(result.isVideo).toBe(false);
  });

  it("should identify videos", async () => {
    vi.mocked(fileType.fileTypeFromFile).mockResolvedValueOnce({
      mime: "video/mp4",
      ext: "mp4",
    });

    const result = await validateFileType("dummy.mp4");
    expect(result.isImage).toBe(false);
    expect(result.isVideo).toBe(true);
  });

  it("should throw for unknown types", async () => {
    vi.mocked(fileType.fileTypeFromFile).mockResolvedValueOnce(undefined);
    await expect(validateFileType("dummy.txt")).rejects.toThrow(
      "Unsupported or unrecognized file type: unknown",
    );
  });

  it("should throw for unsupported mime types", async () => {
    vi.mocked(fileType.fileTypeFromFile).mockResolvedValueOnce({
      mime: "application/pdf",
      ext: "pdf",
    });
    await expect(validateFileType("dummy.pdf")).rejects.toThrow(
      "Unsupported file type: application/pdf",
    );
  });
});
