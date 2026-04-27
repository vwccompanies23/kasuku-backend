import * as ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import * as fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegPath as string);

export const convertToMp3 = (inputPath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const outputPath = inputPath.replace(/\.[^/.]+$/, '.mp3');

    ffmpeg(inputPath)
      .audioBitrate(192)
      .toFormat('mp3')
      .on('end', () => {
        try {
          fs.unlinkSync(inputPath); // delete original
        } catch {}
        resolve(outputPath);
      })
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
};