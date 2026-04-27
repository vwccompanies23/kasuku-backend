import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { createHash } from 'crypto';
import { parseFile } from 'music-metadata';

@Injectable()
export class AudioAnalysisService {

  // =========================
  // 🔁 HASH (DUPLICATE CHECK)
  // =========================
  async generateHash(filePath: string) {
    const buffer = fs.readFileSync(filePath);
    return createHash('sha256').update(buffer).digest('hex');
  }

  // =========================
  // 🎧 ANALYZE AUDIO
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

    // 🎧 FAKE LOUDNESS ESTIMATE (simple)
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