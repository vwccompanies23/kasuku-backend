import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import csv from 'csv-parser';

@Injectable()
export class ImportService {
  async parseCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    });
  }
}