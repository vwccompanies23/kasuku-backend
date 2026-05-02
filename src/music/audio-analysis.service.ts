import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { createHash } from 'crypto';
import { parseFile, parseBuffer } from 'music-metadata';

@Injectable()
export class AudioAnalysisService {

  // =========================
  // 🔁 HASH (FILE PATH)
  // =========================
  async generateHash(filePath: string) {
    const buffer = fs.readFileSync(filePath);
    return createHash('sha256').update(buffer).digest('hex');
  }

  // =========================
  // 🔁 HASH (BUFFER) ✅ NEW
  // =========================
  async generateHashFromBuffer(buffer: Buffer): Promise<string> {
    return createHash('sha256')
      .update(buffer)
      .digest('hex');
  }

  // =========================
  // 🎧 ANALYZE FILE PATH
  // =========================
  async analyze(filePath: string) {
    let duration = 0;
    let bitrate = 0;

    try {
      const metadata = await parseFile(filePath);

      duration = Math.round(metadata.format.duration || 0);
      bitrate = Math.round((metadata.format.bitrate || 0) / 1000);
    } catch (err) {
      console.log('⚠️ Metadata error:', err.message);
    }

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    const loudnessEstimate = fileSize / (duration || 1);

    return {
      duration,
      bitrate,
      fileSize,
      loudness: loudnessEstimate,
    };
  }

  // =========================
  // 🎧 ANALYZE BUFFER ✅ NEW
  // =========================
  async analyzeBuffer(buffer: Buffer) {
    try {
      const metadata = await parseBuffer(buffer);

      return {
        duration: Math.round(metadata.format.duration || 0),
        bitrate: metadata.format.bitrate || 0,
        fileSize: buffer.length,
        loudness: 0, // keep consistent type
      };
    } catch (err) {
      console.log('⚠️ Buffer analysis failed:', err.message);

      return {
        duration: 0,
        bitrate: 0,
        fileSize: buffer.length,
        loudness: 0,
      };
    }
  }

  // =========================
  // 🧠 AI CHECK
  // =========================
  detectIssues(data: {
    duration: number;
    bitrate: number;
    fileSize: number;
    loudness: number;
    isDuplicate?: boolean;
  }) {
    const issues: string[] = [];

    if (data.duration < 30) {
      issues.push('Track too short');
    }

    if (data.bitrate < 128) {
      issues.push('Low bitrate');
    }

    if (data.fileSize < 1000000) {
      issues.push('Low quality file');
    }

    if (data.loudness < 5000) {
      issues.push('Very low loudness');
    }

    if (data.isDuplicate) {
      issues.push('Duplicate audio detected');
    }

    return issues;
  }
}