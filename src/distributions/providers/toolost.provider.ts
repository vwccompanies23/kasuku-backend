import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ToolostProvider {
  async sendRelease(data: any) {
    try {
      const payload = {
        title: data.title,
        artist: data.artists?.[0]?.name,
        upc: data.upc,
        tracks: data.tracks.map((t: any) => ({
          title: t.title,
          isrc: t.isrc,
          audio_url: t.audioUrl,
        })),
        release_date: data.releaseDate,
        label: data.label,
      };

      // ✅ FIXED AXIOS CALL
      const response: any = await axios.post(
        'https://api.distributor.com/releases', // 🔁 replace later with real DSP
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.DISTRIBUTOR_API_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        success: true,
        distributionId: response?.data?.id,
        platforms: response?.data?.platforms || [],
      };
    } catch (err: any) {
      console.error('❌ Distribution error:', err?.response?.data || err);

      return {
        success: false,
        error: err?.response?.data || 'Distribution failed',
      };
    }
  }
}