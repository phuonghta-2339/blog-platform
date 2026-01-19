import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  getHello(): string {
    return 'Hello World!';
  }
}
