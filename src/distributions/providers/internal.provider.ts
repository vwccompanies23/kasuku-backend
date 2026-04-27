import { Injectable } from '@nestjs/common';
import { BaseProvider } from './base.provider';

@Injectable()
export class InternalProvider extends BaseProvider {
  async sendRelease(data: any) {
    console.log('🚀 Internal Distribution:', data.title);

    return {
      success: true,
      distributionId: 'internal_' + Date.now(),
      platforms: [
        { name: 'Spotify', status: 'processing' },
        { name: 'Apple Music', status: 'processing' },
        { name: 'YouTube', status: 'processing' },
      ],
    };
  }
}