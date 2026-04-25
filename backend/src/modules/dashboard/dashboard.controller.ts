import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  async getMetrics(@Query('companyId') companyId?: string) {
    return this.dashboardService.getDashboardData(companyId ? parseInt(companyId) : undefined);
  }
}
