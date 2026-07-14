import { fileTypeFromFile } from "file-type";

export type FileValidationResult = {
  mime: string;
  isImage: boolean;
  isVideo: boolean;
};

/**
 * Validates a file by reading its magic bytes (file signature).
 * This prevents processing of files with spoofed extensions.
 */
export async function validateFileType(filePath: string): Promise<FileValidationResult> {
  const detected = await fileTypeFromFile(filePath);

  if (!detected) {
    throw new Error("Unsupported or unrecognized file type: unknown");
  }

  const isImage = detected.mime.startsWith("image/");
  const isVideo = detected.mime.startsWith("video/");

  if (!isImage && !isVideo) {
    throw new Error(`Unsupported file type: ${detected.mime}`);
  }

  return { mime: detected.mime, isImage, isVideo };
}
