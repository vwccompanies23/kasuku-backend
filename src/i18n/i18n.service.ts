import { Injectable } from '@nestjs/common';

import * as en from './en.json';
import * as fr from './fr.json';
import * as sw from './sw.json';
import * as ln from './ln.json';
import * as rn from './rn.json';
import * as rw from './rw.json';

@Injectable()
export class I18nService {
  private translations: any = {
    en,
    fr,
    sw,
    ln,
    rn,
    rw,
  };

  t(key: string, lang: string = 'en'): string {
    return (
      this.translations[lang]?.[key] ||
      this.translations['en']?.[key] ||
      key
    );
  }
}