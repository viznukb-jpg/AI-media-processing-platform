import sharp from "sharp";
import { logger } from "../../lib/logger";

export class ImageThumbnailStrategy {
  static async generate(inputPath: string, jobId: string): Promise<Buffer> {
    const metadata = await sharp(inputPath).metadata();
    
    logger.info("METADATA_EXTRACTED", {
      jobId,
      metadata: { width: metadata.width, height: metadata.height, format: metadata.format }
    });

    return await sharp(inputPath)
      .resize(300, 300, { fit: "inside" })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}
