import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('psd')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('ping')
  getPing(): string {
    return this.appService.getPing();
  }
}
