import { describe, it, expect } from 'vitest';
import { getMaxBytes, formatBytes, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from '../lib/upload-limits';

describe('upload-limits', () => {
  describe('getMaxBytes', () => {
    it('should return MAX_VIDEO_BYTES for video content types', () => {
      expect(getMaxBytes('video/mp4')).toBe(MAX_VIDEO_BYTES);
      expect(getMaxBytes('video/webm')).toBe(MAX_VIDEO_BYTES);
    });

    it('should return MAX_IMAGE_BYTES for image content types', () => {
      expect(getMaxBytes('image/jpeg')).toBe(MAX_IMAGE_BYTES);
      expect(getMaxBytes('image/png')).toBe(MAX_IMAGE_BYTES);
    });

    it('should default to MAX_IMAGE_BYTES for unknown types', () => {
      expect(getMaxBytes('application/pdf')).toBe(MAX_IMAGE_BYTES);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes to MB', () => {
      expect(formatBytes(25 * 1024 * 1024)).toBe('25 MB');
      expect(formatBytes(250 * 1024 * 1024)).toBe('250 MB');
    });
  });
});
