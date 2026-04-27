export abstract class BaseProvider {
  abstract sendRelease(data: any): Promise<any>;
}