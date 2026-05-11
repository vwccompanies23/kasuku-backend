import { Injectable } from '@nestjs/common';

import { cloudinary } from '../config/cloudinary.config';

@Injectable()
export class CloudinaryService {
  extractPublicId(url: string): string | null {
    try {
      const parts = url.split('/upload/')[1];

      const noVersion = parts
        .split('/')
        .slice(1)
        .join('/');

      return noVersion.replace(/\.[^/.]+$/, '');
    } catch {
      return null;
    }
  }

  async deleteFile(url: string) {
    const publicId = this.extractPublicId(url);

    if (!publicId) return;

    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'auto',
      });

      console.log('☁️ Deleted:', publicId);
    } catch (err: any) {
      console.log(
        '⚠️ Cloud delete failed:',
        err.message,
      );
    }
  }
}