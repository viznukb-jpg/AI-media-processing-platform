import { ImageThumbnailStrategy } from "./image-strategy";
import { VideoThumbnailStrategy } from "./video-strategy";

export class ThumbnailService {
  static async generate(
    isVideo: boolean, 
    inputPath: string, 
    outputPath: string, 
    tmpDir: string, 
    jobId: string
  ): Promise<Buffer> {
    if (isVideo) {
      return await VideoThumbnailStrategy.generate(inputPath, outputPath, tmpDir, jobId);
    } else {
      return await ImageThumbnailStrategy.generate(inputPath, jobId);
    }
  }
}
