// Upload size limits by media type
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;  // 25 MB
export const MAX_VIDEO_BYTES = 250 * 1024 * 1024; // 250 MB

export function getMaxBytes(contentType: string): number {
  if (contentType.startsWith("video/")) return MAX_VIDEO_BYTES;
  return MAX_IMAGE_BYTES;
}

export function formatBytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
