import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import fs from "fs";

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export class VideoThumbnailStrategy {
  static async generate(inputPath: string, outputPath: string, tmpDir: string, jobId: string): Promise<Buffer> {
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .on("end", resolve)
        .on("error", reject)
        .screenshots({
          count: 1,
          timestamps: ['50%'],
          size: '300x300',
          folder: tmpDir,
          filename: `${jobId}-thumb.jpg`
        });
    });
    
    return await fs.promises.readFile(outputPath);
  }
}
