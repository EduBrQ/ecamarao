import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { ViveirosService } from '../viveiros/viveiros.service';
import { UsersService } from '../users/users.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly viveirosService: ViveirosService,
    private readonly usersService: UsersService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.dashboardService.getFazendaDashboard();
  }

  @Get('stats')
  async getStats() {
    const [users, viveiros] = await Promise.all([
      this.usersService.count(),
      this.viveirosService.count(),
    ]);
    return { users, viveiros, timestamp: new Date().toISOString() };
  }
}
