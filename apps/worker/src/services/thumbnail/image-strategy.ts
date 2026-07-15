import sharp from "sharp";
import { logger } from "../../lib/logger";

const SHARP_OPTIONS: sharp.SharpOptions = {
  limitInputPixels: 50000000, // ~50 MP limit (e.g. 8000x6000) to prevent pixel flood attacks
  failOn: "error", // Reject maliciously truncated or corrupted images early
};

export class ImageThumbnailStrategy {
  static async generate(inputPath: string, jobId: string): Promise<Buffer> {
    const metadata = await sharp(inputPath, SHARP_OPTIONS).metadata();
    
    logger.info("METADATA_EXTRACTED", {
      jobId,
      metadata: { width: metadata.width, height: metadata.height, format: metadata.format }
    });

    return await sharp(inputPath, SHARP_OPTIONS)
      .resize(300, 300, { fit: "inside" })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}
